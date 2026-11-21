/*
 * api-auth.js
 * ------------------------------------------------------------
 * Har page par sabse pehle load hota hai.
 *  - Har /api/ request ke saath login token (Authorization header) bhejta hai
 *  - Server 401 (token expire / galat) bheje to logout karke login page par le jaata hai
 *  - Logout ke baad bacha hua purana token saaf kar deta hai
 *
 * Token kahan rehta hai:
 *  - Admin:            sessionStorage.authToken
 *  - Teacher/Student:  localStorage.authToken
 */
(function () {

  // Logout ho chuka hai to purana token hata do
  if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
    sessionStorage.removeItem("authToken");
  }

  if (
    !localStorage.getItem("loggedInTeacher") &&
    !localStorage.getItem("loggedInStudent")
  ) {
    localStorage.removeItem("authToken");
  }

  var LOGIN_PATHS = [
    "/api/admin/login",
    "/api/teachers/login",
    "/api/students/login"
  ];

  function getToken() {
    return (
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("authToken") ||
      ""
    );
  }

  function isApiUrl(url) {
    return url.indexOf("/api/") !== -1;
  }

  function isLoginUrl(url) {
    return LOGIN_PATHS.some(function (p) {
      return url.indexOf(p) !== -1;
    });
  }

  function logoutToLogin() {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedInTeacher");
    localStorage.removeItem("loggedInStudent");

    var onLoginPage = /(^|\/)(index\.html)?$/.test(window.location.pathname);

    if (!onLoginPage) {
      alert("Your session has expired. Please login again.");
      window.location.replace("index.html");
    }
  }

  var originalFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {

    var url =
      typeof input === "string"
        ? input
        : (input && input.url) || String(input);

    if (!isApiUrl(url) || isLoginUrl(url)) {
      return originalFetch(input, init);
    }

    init = init || {};

    var headers = new Headers(
      init.headers ||
      (input && typeof input !== "string" && input.headers) ||
      {}
    );

    var token = getToken();

    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", "Bearer " + token);
    }

    init.headers = headers;

    return originalFetch(input, init).then(function (response) {

      if (response.status === 401) {
        logoutToLogin();
      }

      return response;
    });
  };

})();
