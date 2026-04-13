package com.group2.notification_service.util;

import java.util.Locale;

/**
 * Builds HTML emails that render consistently in Gmail, Outlook, Apple Mail, and mobile clients.
 * <p>
 * Most clients strip or ignore {@code <style>} in {@code <head>}; rely on
 * <strong>inline {@code style="..."}</strong> and table-based layout instead.
 */
public final class EmailHtmlLayout {

    private EmailHtmlLayout() {}

    /**
     * OTP block with large code — used by Brevo JSON payload (escape separately for JSON).
     */
    public static String buildOtpInnerHtml(String otp) {
        String safe = otp == null ? "" : escapeHtml(otp);
        return "<p style=\"margin:0 0 12px;font-size:15px;color:#334155;\">Use this one-time password to continue:</p>"
                + "<p style=\"margin:16px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#1e40af;"
                + "font-family:'Courier New',Courier,monospace;background-color:#eff6ff;padding:16px 20px;"
                + "border-radius:8px;text-align:center;border:1px solid #bfdbfe;\">"
                + safe
                + "</p>"
                + "<p style=\"margin:0;font-size:14px;color:#64748b;\">Valid for <strong style=\"color:#334155;\">10 minutes</strong>. "
                + "If you did not request this, you can ignore this email.</p>";
    }

    /**
     * Wraps arbitrary body: plain text (escaped), HTML fragment, or full document passthrough.
     */
    public static String build(String body) {
        if (body == null) {
            body = "";
        }
        String trimmed = body.trim();
        if (looksLikeFullHtmlDocument(trimmed)) {
            return trimmed;
        }
        String inner = isLikelyHtmlFragment(trimmed) ? trimmed : plainTextToHtml(trimmed);
        return wrapFragment(inner);
    }

    /**
     * Escapes a string for use inside a JSON string value (e.g. Brevo {@code htmlContent}).
     */
    public static String escapeForJson(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static boolean looksLikeFullHtmlDocument(String s) {
        if (s.length() < 10) {
            return false;
        }
        String head = s.substring(0, Math.min(50, s.length())).toLowerCase(Locale.ROOT);
        return head.startsWith("<!doctype") || head.startsWith("<html");
    }

    private static boolean isLikelyHtmlFragment(String s) {
        if (!s.contains("<")) {
            return false;
        }
        String lower = s.toLowerCase(Locale.ROOT);
        return lower.contains("</") || lower.contains("/>") || lower.contains("<br")
                || lower.contains("<p") || lower.contains("<div") || lower.contains("<span")
                || lower.contains("<table") || lower.contains("<ul") || lower.contains("<ol")
                || lower.contains("<h1") || lower.contains("<h2") || lower.contains("<h3")
                || lower.contains("<a ");
    }

    private static String plainTextToHtml(String text) {
        return escapeHtml(text).replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br />\n");
    }

    public static String escapeHtml(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    /**
     * Table-based shell; all important styles are inline (no dependency on {@code <style>}).
     */
    private static String wrapFragment(String innerHtml) {
        return "<!DOCTYPE html>"
                + "<html lang=\"en\" xmlns=\"http://www.w3.org/1999/xhtml\">"
                + "<head>"
                + "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\" />"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />"
                + "<title>SmartSure</title>"
                + "</head>"
                + "<body style=\"margin:0;padding:0;background-color:#f1f5f9;\">"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" "
                + "style=\"background-color:#f1f5f9;padding:24px 12px;\">"
                + "<tr><td align=\"center\">"
                + "<table role=\"presentation\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"600\" "
                + "style=\"width:100%;max-width:600px;background-color:#ffffff;border-radius:12px;"
                + "border:1px solid #e2e8f0;\">"
                + "<tr><td style=\"background-color:#1e40af;padding:22px 24px;text-align:center;\">"
                + "<p style=\"margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;"
                + "color:#bfdbfe;font-family:Arial,Helvetica,sans-serif;\">SmartSure</p>"
                + "<p style=\"margin:10px 0 0;font-size:20px;font-weight:bold;color:#ffffff;"
                + "font-family:Arial,Helvetica,sans-serif;line-height:1.3;\">Insurance Management</p>"
                + "</td></tr>"
                + "<tr><td style=\"padding:28px 24px 32px;font-size:16px;line-height:1.6;color:#334155;"
                + "font-family:Arial,Helvetica,sans-serif;\">"
                + innerHtml
                + "</td></tr>"
                + "<tr><td style=\"padding:16px 24px 22px;border-top:1px solid #e2e8f0;background-color:#f8fafc;"
                + "text-align:center;\">"
                + "<p style=\"margin:0;font-size:12px;color:#64748b;font-family:Arial,Helvetica,sans-serif;\">"
                + "Sent by SmartSure. This is an automated message.</p>"
                + "</td></tr>"
                + "</table>"
                + "</td></tr>"
                + "</table>"
                + "</body></html>";
    }
}
