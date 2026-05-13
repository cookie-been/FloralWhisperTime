package com.floralwhisper.controller;

import com.floralwhisper.dto.FlowerRequest;
import com.floralwhisper.dto.FlowerResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.service.FlowerService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/flowers")
public class FlowerController {
  private final FlowerService flowerService;

  public FlowerController(FlowerService flowerService) {
    this.flowerService = flowerService;
  }

  @GetMapping
  public PaginatedResult<FlowerResponse> list(
      @RequestParam(required = false) String categoryId,
      @RequestParam(required = false) String tag,
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) Integer page,
      @RequestParam(required = false) Integer limit) {
    return flowerService.list(categoryId, tag, keyword, sortBy, page, limit);
  }

  @GetMapping("/{id}")
  public FlowerResponse getById(@PathVariable String id) {
    return flowerService.getById(id);
  }

  @GetMapping("/{id}/related")
  public List<FlowerResponse> related(@PathVariable String id, @RequestParam(required = false) Integer limit) {
    return flowerService.related(id, limit);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public FlowerResponse create(@Valid @RequestBody FlowerRequest request) {
    return flowerService.create(request);
  }

  @PutMapping("/{id}")
  public FlowerResponse update(@PathVariable String id, @Valid @RequestBody FlowerRequest request) {
    return flowerService.update(id, request);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable String id) {
    flowerService.delete(id);
  }
}

