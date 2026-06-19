package com.kkhsmedia.callrecorder;

interface ILogCallback {
    void onLogEvent(String level, String tag, String message, String throwableStackTrace);
}