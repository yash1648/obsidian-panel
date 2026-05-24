package com.panel.console;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ConsoleSessionRegistry {

    private final ConcurrentHashMap<UUID, Set<String>> serverSessions = new ConcurrentHashMap<>();

    public void addSession(UUID serverId, String sessionId) {
        serverSessions.computeIfAbsent(serverId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
    }

    public void removeSession(UUID serverId, String sessionId) {
        Set<String> sessions = serverSessions.get(serverId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                serverSessions.remove(serverId);
            }
        }
    }

    public boolean hasActiveSessions(UUID serverId) {
        Set<String> sessions = serverSessions.get(serverId);
        return sessions != null && !sessions.isEmpty();
    }

    public int getActiveSessionCount(UUID serverId) {
        Set<String> sessions = serverSessions.get(serverId);
        return sessions != null ? sessions.size() : 0;
    }
}
