import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationButton {
  id: string;
  text: string;
  icon?: string;
  url?: string;
}

interface NotificationRequest {
  playerId?: string;
  playerIds?: string[];
  title: string;
  message: string;
  data?: Record<string, any>;
  buttons?: NotificationButton[];
  url?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // ⚠️ TEMPORAIRE - Remplacez par vos vraies clés pour tester
    // TODO: Utilisez les variables d'environnement en production
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID") || "METTEZ_VOTRE_APP_ID_ICI";
    const oneSignalRestApiKey = Deno.env.get("ONESIGNAL_REST_API_KEY") || "METTEZ_VOTRE_REST_API_KEY_ICI";

    if (!oneSignalAppId || oneSignalAppId === "METTEZ_VOTRE_APP_ID_ICI") {
      console.error("❌ OneSignal credentials not configured");
      throw new Error("OneSignal credentials not configured. Please add your App ID and REST API Key.");
    }

    const body: NotificationRequest = await req.json();
    console.log("📥 Received notification request:", body);

    const { playerId, playerIds, title, message, data, buttons, url } = body;

    if (!playerId && (!playerIds || playerIds.length === 0)) {
      throw new Error("Either playerId or playerIds must be provided");
    }

    const includePlayerIds = playerId ? [playerId] : playerIds!;

    const notificationPayload: any = {
      app_id: oneSignalAppId,
      include_player_ids: includePlayerIds,
      headings: { en: title },
      contents: { en: message },
      data: data || {},
    };

    if (url) {
      notificationPayload.url = url;
    }

    if (buttons && buttons.length > 0) {
      notificationPayload.buttons = buttons.map(btn => ({
        id: btn.id,
        text: btn.text,
        icon: btn.icon,
        url: btn.url,
      }));
      notificationPayload.web_buttons = buttons.map(btn => ({
        id: btn.id,
        text: btn.text,
        icon: btn.icon,
        url: btn.url,
      }));
    }

    console.log("🔔 Sending notification to OneSignal:", notificationPayload);

    const oneSignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${oneSignalRestApiKey}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const responseData = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      console.error("❌ OneSignal API error:", responseData);
      throw new Error(`OneSignal API error: ${JSON.stringify(responseData)}`);
    }

    console.log("✅ Notification sent successfully:", responseData);

    return new Response(
      JSON.stringify({
        success: true,
        data: responseData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error sending notification:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
