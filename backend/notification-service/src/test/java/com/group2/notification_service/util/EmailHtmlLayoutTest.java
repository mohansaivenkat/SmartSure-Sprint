package com.group2.notification_service.util;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class EmailHtmlLayoutTest {

    @Test
    void buildWrapsPlainTextAndEscapesHtml() {
        String html = EmailHtmlLayout.build("Hello <script>");
        assertTrue(html.contains("<!DOCTYPE html>"));
        assertTrue(html.contains("Hello &lt;script&gt;"));
        assertTrue(html.contains("background-color:#1e40af"));
    }

    @Test
    void buildPassesThroughFullDocument() {
        String doc = "<!DOCTYPE html><html><body>x</body></html>";
        assertEquals(doc, EmailHtmlLayout.build(doc));
    }

    @Test
    void buildPreservesHtmlFragment() {
        String frag = "<p style=\"color:red;\">Hi</p>";
        String out = EmailHtmlLayout.build(frag);
        assertTrue(out.contains("Hi"));
        assertTrue(out.contains("color:red"));
    }

    @Test
    void otpInnerContainsCode() {
        String inner = EmailHtmlLayout.buildOtpInnerHtml("123456");
        assertTrue(inner.contains("123456"));
        assertTrue(inner.contains("one-time"));
    }

    @Test
    void escapeForJson() {
        assertEquals("a\\\"b\\\\c", EmailHtmlLayout.escapeForJson("a\"b\\c"));
    }
}
