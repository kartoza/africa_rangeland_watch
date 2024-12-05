import axios from "axios";

/**
 * Sets the CSRF token for Axios requests.
 */
export const setCSRFToken = (): void => {
  const csrfToken = document.cookie
    .split(";")
    .find((cookie) => cookie.trim().startsWith("csrftoken="));
  if (csrfToken) {
    const token = csrfToken.split("=")[1];
    axios.defaults.headers.common["X-CSRFToken"] = token;
  } else {
    console.warn("CSRF token not found.");
  }
};
