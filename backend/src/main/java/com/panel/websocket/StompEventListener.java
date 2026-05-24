package com.panel.websocket;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@Slf4j
public class StompEventListener {

    @EventListener
    public void handleWebSocketConnected(SessionConnectedEvent event) {
        log.debug("WebSocket client connected");
    }

    @EventListener
    public void handleWebSocketDisconnected(SessionDisconnectEvent event) {
        log.debug("WebSocket client disconnected");
    }
}
