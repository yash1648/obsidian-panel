package com.panel.servers;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServerRepository extends JpaRepository<Server, UUID> {

    Optional<Server> findByUuid(String uuid);

    List<Server> findByStatus(ServerStatus status);

    Page<Server> findByStatus(ServerStatus status, Pageable pageable);

    @Query("SELECT s.port FROM Server s WHERE s.port IS NOT NULL")
    List<Integer> findAllPorts();

    long countByStatus(ServerStatus status);
}
