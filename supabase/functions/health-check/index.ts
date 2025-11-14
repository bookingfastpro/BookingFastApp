import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=count`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact',
      },
    })

    if (!response.ok) {
      throw new Error(`Database query failed: ${response.status}`)
    }

    const countHeader = response.headers.get('content-range')
    const count = countHeader ? parseInt(countHeader.split('/')[1] || '0') : 0

    const data = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      profiles_count: count,
      message: 'Supabase project is active and responsive',
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const errorData = {
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error occurred',
    }

    return new Response(JSON.stringify(errorData), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
