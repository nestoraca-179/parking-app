package com.parking.billing.repository;

import com.parking.billing.domain.Invoice;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceRepository extends JpaRepository<Invoice, Long>, JpaSpecificationExecutor<Invoice> {

    Optional<Invoice> findByTicketId(UUID ticketId);

    @Query("select count(i), sum(i.subtotal), sum(i.tax), sum(i.total) from Invoice i "
        + "where i.exitAt >= :from and i.exitAt < :to")
    List<Object[]> totalsBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i.exitAt, i.total from Invoice i where i.exitAt >= :from and i.exitAt < :to")
    List<Object[]> exitTotalsBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i.vehicleType, count(i), sum(i.total) from Invoice i "
        + "where i.exitAt >= :from and i.exitAt < :to group by i.vehicleType order by sum(i.total) desc")
    List<Object[]> revenueByVehicleType(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select i.operatorId, i.operatorName, count(i), sum(i.total) from Invoice i "
        + "where i.exitAt >= :from and i.exitAt < :to group by i.operatorId, i.operatorName order by sum(i.total) desc")
    List<Object[]> revenueByOperator(@Param("from") Instant from, @Param("to") Instant to);
}
