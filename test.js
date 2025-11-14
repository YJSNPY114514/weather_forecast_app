// モジュール非依存のブラウザ用スクリプト
(function () {
  function useGeolocationService() {
    async function getMuniCdFromLatLon(latLon) {
      const response = await fetch(
        `https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat=${latLon.lat}&lon=${latLon.lon}`
      );
      if (!response.ok) return undefined;
      const json = await response.json();
      return json.results?.muniCd;
    }

    function getPrefectureCodeFromMuniCd(muniCdInput) {
      const muniCd = muniCdInput.substring(0, 1) === "0" ? muniCdInput.slice(1) : muniCdInput;
      const muniArray = (typeof GSI !== "undefined" && GSI.MUNI_ARRAY) ? GSI.MUNI_ARRAY : undefined;
      const muniContents = muniArray ? muniArray[muniCd] : undefined;
      if (!muniContents) return undefined;
      return muniContents.split(",")[0];
    }

    function getPrefectureFromMuniCd(muniCdInput) {
      const muniCd = muniCdInput.substring(0, 1) === "0" ? muniCdInput.slice(1) : muniCdInput;
      const muniArray = (typeof GSI !== "undefined" && GSI.MUNI_ARRAY) ? GSI.MUNI_ARRAY : undefined;
      const muniContents = muniArray ? muniArray[muniCd] : undefined;
      if (!muniContents) return undefined;
      const [code, name] = muniContents.split(",");
      return { code, name };
    }

    async function getPrefectureCodeFromLatLon(latLon) {
      const muniCd = await getMuniCdFromLatLon(latLon);
      if (!muniCd) return undefined;
      return getPrefectureCodeFromMuniCd(muniCd);
    }

    async function getPrefectureNameFromLatLon(latLon) {
      const muniCd = await getMuniCdFromLatLon(latLon);
      if (!muniCd) return undefined;
      const pref = getPrefectureFromMuniCd(muniCd);
      return pref?.name;
    }

    async function getPrefectureFromLatLon(latLon) {
      const muniCd = await getMuniCdFromLatLon(latLon);
      if (!muniCd) return undefined;
      return getPrefectureFromMuniCd(muniCd);
    }

    return {
      getPrefectureCodeFromLatLon,
      getPrefectureNameFromLatLon,
      getPrefectureFromLatLon
    };
  }

  // グローバル公開
  window.useGeolocationService = useGeolocationService;

  // デモ表示（任意）：#pref があれば東京を表示
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const svc = window.useGeolocationService();
      const latLon = { lat: 35.6762, lon: 139.6503 };
      const pref = await svc.getPrefectureFromLatLon(latLon);
      const out = pref ? `${pref.name} (code: ${pref.code})` : "都道府県を取得できませんでした";
      const el = document.getElementById("pref");
      if (el) el.textContent = out;
    } catch (e) {
      console.error(e);
    }
  });
})();
