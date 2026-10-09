package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class FestivalRequest {
    private String name;
    private String city;
    private String location;
    private String imageUrl;
    private String description;
    private String startDate;
    private String endDate;
    private String badgeInfo;
    private List<Long> homestayIds = new ArrayList<>();
    private List<String> distanceLabels = new ArrayList<>();
}
