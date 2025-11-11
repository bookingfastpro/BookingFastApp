import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SmsRequest {
  user_id: string;
  to_phone: string;
  message: string;
  workflow_id?: string;
  booking_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const requestData: SmsRequest = await req.json();
    const { user_id, to_phone, message, workflow_id, booking_id } = requestData;

    if (!user_id || !to_phone || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, to_phone, message" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { createClient } = await import("jsr:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settings, error: settingsError } = await supabase
      .from("business_settings")
      .select("twilio_enabled, twilio_account_sid, twilio_auth_token, twilio_phone_number")
      .eq("user_id", user_id)
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching Twilio settings:", settingsError);
      throw new Error("Failed to fetch Twilio configuration");
    }

    if (!settings || !settings.twilio_enabled) {
      return new Response(
        JSON.stringify({ error: "Twilio is not enabled for this user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { twilio_account_sid, twilio_auth_token, twilio_phone_number } = settings;

    if (!twilio_account_sid || !twilio_auth_token || !twilio_phone_number) {
      return new Response(
        JSON.stringify({ error: "Twilio configuration is incomplete" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const cleanPhone = to_phone.replace(/\s+/g, "");
    if (!cleanPhone.startsWith("+")) {
      return new Response(
        JSON.stringify({ error: "Phone number must be in E.164 format (e.g., +33612345678)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (message.length > 160) {
      return new Response(
        JSON.stringify({ error: "SMS message exceeds 160 characters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Sending SMS via Twilio...");
    console.log("From:", twilio_phone_number);
    console.log("To:", cleanPhone);
    console.log("Message length:", message.length);

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilio_account_sid}/Messages.json`;
    const authHeader = btoa(`${twilio_account_sid}:${twilio_auth_token}`);

    const formData = new URLSearchParams();
    formData.append("To", cleanPhone);
    formData.append("From", twilio_phone_number);
    formData.append("Body", message);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio API error:", twilioData);

      await supabase.from("sms_logs").insert({
        user_id,
        workflow_id: workflow_id || null,
        booking_id: booking_id || null,
        to_phone: cleanPhone,
        content: message,
        status: "failed",
        error_message: twilioData.message || "Unknown Twilio error",
      });

      return new Response(
        JSON.stringify({
          error: "Failed to send SMS",
          details: twilioData.message,
        }),
        {
          status: twilioResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("SMS sent successfully:", twilioData.sid);

    await supabase.from("sms_logs").insert({
      user_id,
      workflow_id: workflow_id || null,
      booking_id: booking_id || null,
      to_phone: cleanPhone,
      content: message,
      status: "sent",
      twilio_sid: twilioData.sid,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message_sid: twilioData.sid,
        status: twilioData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-twilio-sms function:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
