package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "booking_extras")
@IdClass(BookingExtraId.class)
public class BookingExtra {

    @Id
    @Column(name = "booking_id")
    private Long bookingId;

    @Id
    @Column(name = "extra_id")
    private Long extraId;

    private Integer quantity;

    private BigDecimal price;

    @Column(name = "service_name")
    private String serviceName;

    public BookingExtra() {
    }

    public BookingExtra(Long bookingId, Long extraId, Integer quantity, BigDecimal price, String serviceName) {
        this.bookingId = bookingId;
        this.extraId = extraId;
        this.quantity = quantity;
        this.price = price;
        this.serviceName = serviceName;
    }

    public Long getBookingId() {
        return bookingId;
    }

    public void setBookingId(Long bookingId) {
        this.bookingId = bookingId;
    }

    public Long getExtraId() {
        return extraId;
    }

    public void setExtraId(Long extraId) {
        this.extraId = extraId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public static BookingExtraBuilder builder() {
        return new BookingExtraBuilder();
    }

    public static class BookingExtraBuilder {
        private Long bookingId;
        private Long extraId;
        private Integer quantity;
        private BigDecimal price;
        private String serviceName;

        public BookingExtraBuilder bookingId(Long bookingId) {
            this.bookingId = bookingId;
            return this;
        }

        public BookingExtraBuilder extraId(Long extraId) {
            this.extraId = extraId;
            return this;
        }

        public BookingExtraBuilder quantity(Integer quantity) {
            this.quantity = quantity;
            return this;
        }

        public BookingExtraBuilder price(BigDecimal price) {
            this.price = price;
            return this;
        }

        public BookingExtraBuilder serviceName(String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        public BookingExtra build() {
            return new BookingExtra(bookingId, extraId, quantity, price, serviceName);
        }
    }
}
