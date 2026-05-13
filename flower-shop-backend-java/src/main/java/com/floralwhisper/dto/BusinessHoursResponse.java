package com.floralwhisper.dto;

import lombok.Data;

@Data
public class BusinessHoursResponse {
  private TimeRangeResponse monday;
  private TimeRangeResponse tuesday;
  private TimeRangeResponse wednesday;
  private TimeRangeResponse thursday;
  private TimeRangeResponse friday;
  private TimeRangeResponse saturday;
  private TimeRangeResponse sunday;
}

