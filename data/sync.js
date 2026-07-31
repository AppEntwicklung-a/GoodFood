// ── Supabase-Sync für GoodFood (Haushalt-Sharing über Zugangscode) ──
// Nutzt die REST-API direkt (kein SDK nötig).
window.SYNC = (function () {
  var URL = "https://cekxwofsvuuuovubbkxs.supabase.co";
  var KEY = "sb_publishable_gIDXO05182ZhZvDQcCjc4Q_3uPKmeWB";
  var TABLE = "haushalt_data";

  function headers() {
    return {
      "apikey": KEY,
      "Authorization": "Bearer " + KEY,
      "Content-Type": "application/json"
    };
  }

  // Ein Datenpaket hochladen (upsert)
  function push(code, bucket, uid, payload) {
    var id = code + ":" + uid + ":" + bucket;
    var row = {
      id: id, code: code, bucket: bucket, uid: uid,
      payload: payload, updated_at: new Date().toISOString()
    };
    return fetch(URL + "/rest/v1/" + TABLE + "?on_conflict=id", {
      method: "POST",
      headers: Object.assign(headers(), { "Prefer": "resolution=merge-duplicates" }),
      body: JSON.stringify(row)
    }).then(function (r) {
      if (!r.ok) throw new Error("push " + r.status);
      return true;
    });
  }

  // Alle Daten eines Haushalts-Codes laden
  function pullAll(code) {
    var q = URL + "/rest/v1/" + TABLE + "?code=eq." + encodeURIComponent(code) + "&select=id,bucket,uid,payload,updated_at";
    return fetch(q, { headers: headers() }).then(function (r) {
      if (!r.ok) throw new Error("pull " + r.status);
      return r.json();
    });
  }

  // Verbindung testen (gibt true/false zurück)
  function test() {
    return fetch(URL + "/rest/v1/" + TABLE + "?select=id&limit=1", { headers: headers() })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  return { push: push, pullAll: pullAll, test: test };
})();
