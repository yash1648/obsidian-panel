package com.panel.rcon;

import lombok.extern.slf4j.Slf4j;

import java.io.Closeable;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.Random;

/**
 * Low-level Minecraft RCON protocol client.
 * Implements the SRP (Server RCON Protocol) as defined by Valve.
 */
@Slf4j
public class RconClient implements Closeable {

    private static final int TYPE_AUTH = 3;
    private static final int TYPE_COMMAND = 2;
    private static final int TYPE_RESPONSE = 0;
    private static final int TYPE_AUTH_RESPONSE = 2;

    private final String host;
    private final int port;
    private final String password;
    private final int timeout;

    private Socket socket;
    private DataInputStream in;
    private DataOutputStream out;
    private boolean authenticated;

    public RconClient(String host, int port, String password, int timeout) {
        this.host = host;
        this.port = port;
        this.password = password;
        this.timeout = timeout;
    }

    public void connect() throws IOException {
        socket = new Socket();
        socket.connect(new InetSocketAddress(host, port), timeout);
        socket.setSoTimeout(timeout);

        in = new DataInputStream(socket.getInputStream());
        out = new DataOutputStream(socket.getOutputStream());

        authenticate();
    }

    private void authenticate() throws IOException {
        int requestId = sendPacket(TYPE_AUTH, password);
        int[] response = readPacket();

        if (response[0] == -1 || response[1] != TYPE_AUTH_RESPONSE) {
            throw new IOException("RCON authentication failed");
        }

        this.authenticated = true;
    }

    public String sendCommand(String command) throws IOException {
        if (!authenticated) {
            throw new IOException("Not authenticated to RCON");
        }

        int requestId = sendPacket(TYPE_COMMAND, command);
        int[] header = readPacket();

        if (header[0] != requestId) {
            log.warn("RCON response ID mismatch: expected {} got {}", requestId, header[0]);
        }

        // Read the response body
        int bodyLength = header[2] - 4; // Subtract the requestId int
        byte[] body = new byte[Math.max(0, bodyLength)];
        if (bodyLength > 0) {
            in.readFully(body);
        }
        // Read padding
        in.readFully(new byte[2]);

        String response = new String(body, StandardCharsets.UTF_8).trim();
        log.debug("RCON response: {}", response);
        return response;
    }

    private int sendPacket(int type, String payload) throws IOException {
        int requestId = new Random().nextInt(Integer.MAX_VALUE);
        byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

        int packetLength = 4 + 4 + payloadBytes.length + 2; // requestId + type + payload + padding
        ByteBuffer buffer = ByteBuffer.allocate(packetLength + 4);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        buffer.putInt(packetLength);    // Length of rest of packet
        buffer.putInt(requestId);       // Request ID
        buffer.putInt(type);            // Type
        buffer.put(payloadBytes);       // Payload
        buffer.put((byte) 0);           // Null terminator
        buffer.put((byte) 0);           // Padding

        out.write(buffer.array());
        out.flush();

        return requestId;
    }

    private int[] readPacket() throws IOException {
        int size = Integer.reverseBytes(in.readInt());
        int requestId = Integer.reverseBytes(in.readInt());
        int type = Integer.reverseBytes(in.readInt());

        return new int[]{requestId, type, size};
    }

    @Override
    public void close() throws IOException {
        if (socket != null && !socket.isClosed()) {
            try {
                socket.close();
            } catch (IOException e) {
                log.warn("Error closing RCON socket", e);
            }
        }
    }
}
