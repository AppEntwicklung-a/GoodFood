// ── Supabase Auth + Daten für GoodFood (echte Accounts pro Nutzer) ──
// Nutzt die REST- und Auth-API direkt (kein SDK).
window.SYNC = (function () {
  var URL = "https://cekxwofsvuuuovubbkxs.supabase.co";
  var KEY = "sb_publishable_gIDXO05182ZhZvDQcCjc4Q_3uPKmeWB";
  var TABLE = "user_data";
  var EMAIL_DOMAIN = "@goodfood.local"; // Benutzername -> interne Pseudo-Mail

  // Benutzername säubern (klein, keine Sonderzeichen außer . _ -)
  function normUser(u) {
    return String(u || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
  }
  function userToEmail(u) { return normUser(u) + EMAIL_DOMAIN; }

  function baseHeaders() {
    return { "apikey": KEY, "Content-Type": "application/json" };
  }
  function authHeaders(token) {
    return {
      "apikey": KEY,
      "Authorization": "Bearer " + (token || KEY),
      "Content-Type": "application/json"
    };
  }

  // ── Registrieren ──
  function signUp(username, password) {
    var email = userToEmail(username);
    return fetch(URL + "/auth/v1/signup", {
      method: "POST", headers: baseHeaders(),
      body: JSON.stringify({ email: email, password: password, data: { username: normUser(username) } })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok) {
          var msg = (body && (body.msg || body.error_description || body.error)) || ("Fehler " + r.status);
          throw new Error(msg);
        }
        // session kann direkt dabei sein (wenn E-Mail-Bestätigung aus)
        return body;
      });
    });
  }

  // ── Anmelden ──
  function signIn(username, password) {
    var email = userToEmail(username);
    return fetch(URL + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: baseHeaders(),
      body: JSON.stringify({ email: email, password: password })
    }).then(function (r) {
      return r.json().then(function (body) {
        if (!r.ok) {
          var msg = (body && (body.msg || body.error_description || body.error)) || "Anmeldung fehlgeschlagen";
          throw new Error(msg);
        }
        return body; // enthält access_token, refresh_token, user
      });
    });
  }

  // ── Session mit Refresh-Token erneuern ──
  function refresh(refreshToken) {
    return fetch(URL + "/auth/v1/token?grant_type=refresh_token", {
      method: "POST", headers: baseHeaders(),
      body: JSON.stringify({ refresh_token: refreshToken })
    }).then(function (r) {
      if (!r.ok) throw new Error("refresh " + r.status);
      return r.json();
    });
  }

  // ── Abmelden ──
  function signOut(token) {
    return fetch(URL + "/auth/v1/logout", {
      method: "POST", headers: authHeaders(token)
    }).catch(function () { });
  }

  // ── Bucket hochladen (recipes | profile) ──
  function push(token, userId, bucket, payload) {
    var row = { user_id: userId, bucket: bucket, payload: payload, updated_at: new Date().toISOString() };
    return fetch(URL + "/rest/v1/" + TABLE + "?on_conflict=user_id,bucket", {
      method: "POST",
      headers: Object.assign(authHeaders(token), { "Prefer": "resolution=merge-duplicates" }),
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) throw new Error("push " + r.status);
      return true;
    });
  }

  // ── Alle Daten des eingeloggten Nutzers laden ──
  function pull(token) {
    return fetch(URL + "/rest/v1/" + TABLE + "?select=bucket,payload,updated_at", {
      headers: authHeaders(token)
    }).then(function (r) {
      if (!r.ok) throw new Error("pull " + r.status);
      return r.json();
    });
  }

  return {
    normUser: normUser,
    signUp: signUp, signIn: signIn, signOut: signOut, refresh: refresh,
    push: push, pull: pull
  };
})();
