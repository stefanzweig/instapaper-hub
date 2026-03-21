export async function onRequestPost({ env, request }) {
  // Validate environment variables
  if (!env.INSTAPAPER_USERNAME || !env.INSTAPAPER_PASSWORD) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Server configuration error: missing credentials'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { url } = await request.json();

  // Validate URL
  if (!url || typeof url !== 'string') {
    return new Response(JSON.stringify({
      success: false,
      message: 'Invalid or missing URL'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Call Instapaper Simple API
    const response = await fetch('https://www.instapaper.com/api/add', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${env.INSTAPAPER_USERNAME}:${env.INSTAPAPER_PASSWORD}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `url=${encodeURIComponent(url)}`
    });

    if (response.status === 200) {
      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully added to Instapaper'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Handle error responses
    let errorMessage = 'Failed to add to Instapaper';
    if (response.status === 400) {
      errorMessage = 'Invalid URL';
    } else if (response.status === 401) {
      errorMessage = 'Authentication failed. Check credentials.';
    } else if (response.status === 429) {
      errorMessage = 'Rate limit exceeded. Try again later.';
    }

    return new Response(JSON.stringify({
      success: false,
      message: errorMessage
    }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Network error: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
