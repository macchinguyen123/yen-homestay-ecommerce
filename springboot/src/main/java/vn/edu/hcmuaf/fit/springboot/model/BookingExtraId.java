package vn.edu.hcmuaf.fit.springboot.model;

import java.io.Serializable;
import java.util.Objects;

public class BookingExtraId implements Serializable {
    private Long bookingId;
    private Long extraId;

    public BookingExtraId() {
    }

    public BookingExtraId(Long bookingId, Long extraId) {
        this.bookingId = bookingId;
        this.extraId = extraId;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BookingExtraId that = (BookingExtraId) o;
        return Objects.equals(bookingId, that.bookingId) && Objects.equals(extraId, that.extraId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(bookingId, extraId);
    }
}
