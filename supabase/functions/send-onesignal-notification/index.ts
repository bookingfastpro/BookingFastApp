import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface NotificationPayload {
  userId: string;
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'payment_reminder' | 'payment_completed';
  title: string;
  message: string;
  bookingId?: string;
  data?: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const oneSignalAppId = Deno.env.get('ONESIGNAL_APP_ID');
    const oneSignalApiKey = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    if (!oneSignalAppId || !oneSignalApiKey) {
      throw new Error('Missing OneSignal configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    const { userId, type, title, message, bookingId, data } = payload;

    console.log('📧 Sending OneSignal notification:', {
      userId,
      type,
      title,
      bookingId
    });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onesignal_player_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.onesignal_player_id) {
      console.warn('⚠️ User does not have OneSignal player ID:', userId);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'User not subscribed to push notifications'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const notificationData = {
      type,
      bookingId,
      timestamp: new Date().toISOString(),
      ...data
    };

    const oneSignalPayload = {
      app_id: oneSignalAppId,
      include_player_ids: [profile.onesignal_player_id],
      headings: { en: title },
      contents: { en: message },
      data: notificationData,
      web_push_topic: 'booking_notifications',
      priority: 10,
      ttl: 86400
    };

    console.log('📤 Sending to OneSignal API...');

    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`
      },
      body: JSON.stringify(oneSignalPayload)
    });

    const oneSignalResult = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      console.error('❌ OneSignal API error:', oneSignalResult);

      await supabase
        .from('notifications')
        .update({
          onesignal_sent: false,
          onesignal_error: JSON.stringify(oneSignalResult)
        })
        .eq('user_id', userId)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'OneSignal API error',
          details: oneSignalResult
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('✅ Notification sent successfully:', oneSignalResult.id);

    if (bookingId) {
      await supabase
        .from('notifications')
        .update({
          onesignal_notification_id: oneSignalResult.id,
          onesignal_sent: true,
          onesignal_sent_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1);
    }

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: oneSignalResult.id,
        recipients: oneSignalResult.recipients
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error sending OneSignal notification:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
