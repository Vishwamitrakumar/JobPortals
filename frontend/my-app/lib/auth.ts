const API = process.env.NEXT_PUBLIC_API || "";

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh");

  if (!refresh) {
    return null;
  }

  try {
    const response = await fetch(`${API}/api/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh,
      }),
    });

    if (!response.ok) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return null;
    }

    const data = await response.json();

    if (!data.access) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return null;
    }

    localStorage.setItem("access", data.access);

    return data.access;
  } catch (error) {
    console.error("Refresh token error:", error);

    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    return null;
  }
}


export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {

  let access = localStorage.getItem("access");

  // ------------------------------------
  // FIRST REQUEST
  // ------------------------------------

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });


  // ------------------------------------
  // ACCESS TOKEN EXPIRED
  // ------------------------------------

  if (response.status === 401) {

    console.log("Access token expired. Refreshing...");

    const newAccess = await refreshAccessToken();

    // ------------------------------------
    // REFRESH TOKEN INVALID / EXPIRED
    // ------------------------------------

    if (!newAccess) {

      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      window.location.href = "/login";

      return response;
    }


    // ------------------------------------
    // RETRY ORIGINAL REQUEST
    // ------------------------------------

    const retryHeaders = new Headers(options.headers);

    retryHeaders.set("Content-Type", "application/json");

    retryHeaders.set(
      "Authorization",
      `Bearer ${newAccess}`
    );

    response = await fetch(url, {
      ...options,
      headers: retryHeaders,
    });
  }

  return response;
}