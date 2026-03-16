import React, { useMemo, useState } from "react";
import { AuthService } from "./auth/services/auth.service";

/**
 * Small helpers
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values) {
  const errors = {};

  if (!values.firstName.trim()) errors.firstName = "First name is required.";
  if (!values.lastName.trim()) errors.lastName = "Last name is required.";

  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!emailRegex.test(values.email.trim()))
    errors.email = "Enter a valid email address.";

  if (!values.password) errors.password = "Password is required.";
  else if (values.password.length < 8)
    errors.password = "Password must be at least 8 characters.";
  else if (!/[A-Z]/.test(values.password) || !/[0-9]/.test(values.password))
    errors.password = "Password must include 1 uppercase letter and 1 number.";

  if (!values.departmentMode) errors.department = "Department is required.";
  else if (values.departmentMode === "preset" && !values.departmentPreset)
    errors.department = "Pick a department.";
  else if (values.departmentMode === "custom" && !values.departmentCustom.trim())
    errors.department = "Enter a department name.";

  return errors;
}

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

export default function Setup() {
  const departmentOptions = useMemo(
    () => [
      "Engineering",
      "Product",
      "Design",
      "Sales",
      "Marketing",
      "Operations",
      "Finance",
      "HR",
      "Support",
    ],
    []
  );

  const [step, setStep] = useState("form"); // "form" | "verify" | "done"
  const [submitting, setSubmitting] = useState(false);
  const [bannerError, setBannerError] = useState("");
  const [bannerInfo, setBannerInfo] = useState("");

  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    departmentMode: "preset", // "preset" | "custom"
    departmentPreset: "",
    departmentCustom: "",
  });

  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const departmentValue =
    values.departmentMode === "custom"
      ? values.departmentCustom.trim()
      : values.departmentPreset;

  function setField(name, value) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function onBlur(name) {
    setTouched((t) => ({ ...t, [name]: true }));
  }

  function runValidation(nextValues = values) {
    const errs = validate(nextValues);
    setFieldErrors(errs);
    return errs;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setBannerError("");
    setBannerInfo("");

    const errs = runValidation(values);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      department: true,
    });

    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const finalDepartment = departmentValue;

      await AuthService.signUp({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
        department: finalDepartment,
      });

      setStep("verify");
      setBannerInfo("Verification email sent. Check your inbox (and spam).");
    } catch (err) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") {
        setFieldErrors((prev) => ({ ...prev, email: "That email is already in use." }));
        setTouched((t) => ({ ...t, email: true }));
      } else if (code === "auth/weak-password") {
        setFieldErrors((prev) => ({ ...prev, password: "Password is too weak." }));
        setTouched((t) => ({ ...t, password: true }));
      } else if (code === "auth/invalid-email") {
        setFieldErrors((prev) => ({ ...prev, email: "Enter a valid email address." }));
        setTouched((t) => ({ ...t, email: true }));
      } else {
        setBannerError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setBannerError("");
    setBannerInfo("");
    setSubmitting(true);
    try {
      const res = await AuthService.resendVerificationEmail();
      setBannerInfo(res.message || "Verification email re-sent.");
    } catch (err) {
      setBannerError(err?.message || "Could not resend verification. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onIHaveVerified() {
    setBannerError("");
    setBannerInfo("");
    setSubmitting(true);
    try {
      const verified = await AuthService.checkEmailVerification();
      if (verified) {
        setStep("done");
      } else {
        setBannerError("Not verified yet. Click the link in your email, then try again.");
      }
    } catch {
      setBannerError("Could not verify status. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const showError = (key) => {
    // "department" is a virtual field; the real controls are departmentPreset / departmentCustom
    if (key === "department") return touched.department && fieldErrors.department;
    return touched[key] && fieldErrors[key];
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.brandDot} />
          <div>
            <h1 style={styles.title}>Set up your account</h1>
            <p style={styles.subtitle}>
              Create your profile — backed by Firebase Auth and synced to our database.
            </p>
          </div>
        </div>

        {bannerError ? (
          <div style={{ ...styles.banner, ...styles.bannerError }}>
            {bannerError}
          </div>
        ) : null}

        {bannerInfo ? (
          <div style={{ ...styles.banner, ...styles.bannerInfo }}>
            {bannerInfo}
          </div>
        ) : null}

        {step === "form" && (
          <form onSubmit={onSubmit} noValidate>
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>First name</label>
                <input
                  style={inputStyle(showError("firstName"))}
                  value={values.firstName}
                  onChange={(e) => {
                    const next = { ...values, firstName: e.target.value };
                    setValues(next);
                    if (touched.firstName) runValidation(next);
                  }}
                  onBlur={() => onBlur("firstName")}
                  placeholder="Owen"
                  autoComplete="given-name"
                />
                {showError("firstName") ? (
                  <div style={styles.err}>{fieldErrors.firstName}</div>
                ) : null}
              </div>

              <div>
                <label style={styles.label}>Last name</label>
                <input
                  style={inputStyle(showError("lastName"))}
                  value={values.lastName}
                  onChange={(e) => {
                    const next = { ...values, lastName: e.target.value };
                    setValues(next);
                    if (touched.lastName) runValidation(next);
                  }}
                  onBlur={() => onBlur("lastName")}
                  placeholder="Fox"
                  autoComplete="family-name"
                />
                {showError("lastName") ? (
                  <div style={styles.err}>{fieldErrors.lastName}</div>
                ) : null}
              </div>
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Email</label>
              <input
                style={inputStyle(showError("email"))}
                value={values.email}
                onChange={(e) => {
                  const next = { ...values, email: e.target.value };
                  setValues(next);
                  if (touched.email) runValidation(next);
                }}
                onBlur={() => onBlur("email")}
                placeholder="you@company.com"
                autoComplete="email"
                inputMode="email"
              />
              {showError("email") ? (
                <div style={styles.err}>{fieldErrors.email}</div>
              ) : null}
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Password</label>
              <input
                style={inputStyle(showError("password"))}
                value={values.password}
                onChange={(e) => {
                  const next = { ...values, password: e.target.value };
                  setValues(next);
                  if (touched.password) runValidation(next);
                }}
                onBlur={() => onBlur("password")}
                placeholder="At least 8 chars"
                type="password"
                autoComplete="new-password"
              />
              <div style={styles.hint}>
                Must be 8+ chars, include 1 uppercase letter and 1 number.
              </div>
              {showError("password") ? (
                <div style={styles.err}>{fieldErrors.password}</div>
              ) : null}
            </div>

            <div style={styles.block}>
              <label style={styles.label}>Department</label>

              <div style={styles.inlineRow}>
                <label style={radioLabelStyle(values.departmentMode === "preset")}>
                  <input
                    type="radio"
                    name="deptMode"
                    checked={values.departmentMode === "preset"}
                    onChange={() => {
                      const next = { ...values, departmentMode: "preset" };
                      setValues(next);
                      setTouched((t) => ({ ...t, department: true }));
                      runValidation(next);
                    }}
                  />
                  <span>Choose</span>
                </label>

                <label style={radioLabelStyle(values.departmentMode === "custom")}>
                  <input
                    type="radio"
                    name="deptMode"
                    checked={values.departmentMode === "custom"}
                    onChange={() => {
                      const next = { ...values, departmentMode: "custom" };
                      setValues(next);
                      setTouched((t) => ({ ...t, department: true }));
                      runValidation(next);
                    }}
                  />
                  <span>Custom</span>
                </label>
              </div>

              {values.departmentMode === "preset" ? (
                <select
                  style={inputStyle(showError("department"))}
                  value={values.departmentPreset}
                  onChange={(e) => {
                    const next = { ...values, departmentPreset: e.target.value };
                    setValues(next);
                    setTouched((t) => ({ ...t, department: true }));
                    runValidation(next);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, department: true }))}
                >
                  <option value="">Select a department</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  style={inputStyle(showError("department"))}
                  value={values.departmentCustom}
                  onChange={(e) => {
                    const next = { ...values, departmentCustom: e.target.value };
                    setValues(next);
                    setTouched((t) => ({ ...t, department: true }));
                    runValidation(next);
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, department: true }))}
                  placeholder="e.g., Partnerships"
                />
              )}

              {showError("department") ? (
                <div style={styles.err}>{fieldErrors.department}</div>
              ) : null}
            </div>

            <button
              type="submit"
              style={buttonStyle(submitting)}
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Create account"}
            </button>

            <div style={styles.footerText}>
              Already have an account? <span style={styles.link}>Sign in</span>
            </div>
          </form>
        )}

        {step === "verify" && (
          <div>
            <h2 style={styles.h2}>Verify your email</h2>
            <p style={styles.p}>
              We sent a verification link to <b>{values.email}</b>. Click the link,
              then come back here.
            </p>

            <div style={styles.verifyBox}>
              <div style={styles.verifyRow}>
                <div style={styles.verifyTitle}>Didn't get it?</div>
                <button
                  type="button"
                  style={secondaryButtonStyle(submitting)}
                  disabled={submitting}
                  onClick={onResend}
                >
                  {submitting ? "Sending…" : "Resend email"}
                </button>
              </div>

              <div style={styles.divider} />

              <button
                type="button"
                style={buttonStyle(submitting)}
                disabled={submitting}
                onClick={onIHaveVerified}
              >
                {submitting ? "Checking…" : "I verified my email"}
              </button>

              <div style={styles.smallNote}>
                We'll confirm your status from Firebase — click after you finish verification.
              </div>
            </div>

            <button
              type="button"
              style={linkButtonStyle}
              onClick={() => setStep("form")}
            >
              ← Back to form
            </button>
          </div>
        )}

        {step === "done" && (
          <div>
            <h2 style={styles.h2}>You're all set</h2>
            <p style={styles.p}>
              Email verified and account created. Next step: route into the app.
            </p>
            <button type="button" style={buttonStyle(false)}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Styles: using CSS variables for theme compatibility
 */
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 16px",
    background: "var(--bg)",
    color: "var(--text-strong)",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "var(--card)",
    border: "1px solid var(--stroke)",
    borderRadius: 18,
    padding: 22,
    boxShadow: "var(--shadow)",
    backdropFilter: "blur(10px)",
  },
  header: { display: "flex", gap: 12, alignItems: "center", marginBottom: 14 },
  brandDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: "var(--brand)",
    boxShadow: "0 0 0 6px rgba(0,75,145,0.18)",
  },
  title: { margin: 0, fontSize: 22, lineHeight: "28px" },
  subtitle: { margin: "4px 0 0 0", color: "var(--text-soft)", fontSize: 13 },

  banner: {
    marginTop: 12,
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: "18px",
  },
  bannerError: {
    background: "var(--error-bg)",
    border: "1px solid var(--error-border)",
    color: "var(--error-text)",
  },
  bannerInfo: {
    background: "var(--success-bg)",
    border: "1px solid var(--success-border)",
    color: "var(--success-text)",
  },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  block: { marginTop: 12 },

  label: { display: "block", fontSize: 12, color: "var(--text-soft)", marginBottom: 6 },
  hint: { fontSize: 12, color: "var(--text-soft)", marginTop: 6 },
  err: { marginTop: 6, fontSize: 12, color: "var(--error-text)" },

  inlineRow: { display: "flex", gap: 10, marginBottom: 10 },
  footerText: { marginTop: 14, fontSize: 13, color: "var(--text-soft)" },
  link: { color: "var(--brand-2)", cursor: "pointer" },

  h2: { margin: "10px 0 8px 0", fontSize: 18 },
  p: { margin: "0 0 14px 0", color: "var(--text-soft)", lineHeight: "20px" },

  verifyBox: {
    background: "var(--input-bg)",
    border: "1px solid var(--stroke)",
    borderRadius: 14,
    padding: 14,
  },
  verifyRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  verifyTitle: { fontSize: 13, color: "var(--text-soft)" },
  divider: {
    height: 1,
    background: "var(--stroke)",
    margin: "12px 0",
  },
  smallNote: { marginTop: 10, fontSize: 12, color: "var(--text-soft)" },
};

function inputStyle(isError) {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: isError ? "1px solid var(--error-border)" : "1px solid var(--stroke)",
    background: "var(--input-bg)",
    color: "var(--text-strong)",
    outline: "none",
  };
}

function buttonStyle(loading) {
  return {
    width: "100%",
    marginTop: 14,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid var(--stroke)",
    background: loading ? "var(--brand)" : "var(--brand)",
    color: "white",
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    opacity: loading ? 0.65 : 1,
  };
}

function secondaryButtonStyle(loading) {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--stroke)",
    background: "var(--input-bg)",
    color: "var(--text-strong)",
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
    opacity: loading ? 0.65 : 1,
  };
}

const linkButtonStyle = {
  marginTop: 14,
  padding: 0,
  background: "transparent",
  border: "none",
  color: "var(--brand-2)",
  cursor: "pointer",
};

function radioLabelStyle(active) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 12,
    border: active ? "1px solid var(--brand-2)" : "1px solid var(--stroke)",
    background: active ? "var(--eyebrow-bg)" : "var(--input-bg)",
    cursor: "pointer",
    fontSize: 13,
  };
}
