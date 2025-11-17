// api.js - cliente HTTP simples
const API = (function(){
  // Substitua pelo URL do backend (ex: https://great-erp.onrender.com)
  const API_BASE = ""; // <-- CONFIGURAR AQUI ou injetar no deploy

  async function request(path, opts = {}) {
    const url = (API_BASE || "") + "/api/v1" + path;
    const headers = opts.headers || {};
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    // token handling (placeholder) - programador deve implementar armazenamento seguro
    const token = sessionStorage.getItem("gn_token");
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(url, Object.assign({ headers }, opts));
    if (!res.ok) {
      const txt = await res.text();
      let err;
      try { err = JSON.parse(txt); } catch(e){ err = { message: txt } }
      throw err;
    }
    return await res.json();
  }

  return {
    get: (p) => request(p, { method: "GET" }),
    post: (p, body) => request(p, { method: "POST", body: JSON.stringify(body) }),
    put: (p, body) => request(p, { method: "PUT", body: JSON.stringify(body) }),
    del: (p) => request(p, { method: "DELETE" }),
    // upload helper (presigned) - programador: backend deve expor /documents/presign
    async uploadFile(presignUrl, file, fields = null) {
      if (fields) {
        // presigned POST
        const fd = new FormData();
        Object.entries(fields).forEach(([k,v]) => fd.append(k,v));
        fd.append("file", file);
        const r = await fetch(presignUrl, { method: "POST", body: fd });
        if (!r.ok) throw new Error("Upload failed");
        return r;
      } else {
        // PUT
        const r = await fetch(presignUrl, { method: "PUT", body: file });
        if (!r.ok) throw new Error("Upload failed");
        return r;
      }
    }
  };
})();
