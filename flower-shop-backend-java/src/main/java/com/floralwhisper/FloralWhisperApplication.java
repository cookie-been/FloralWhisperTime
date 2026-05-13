package com.floralwhisper;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@MapperScan("com.floralwhisper.mapper")
@SpringBootApplication
public class FloralWhisperApplication {
  public static void main(String[] args) {
    SpringApplication.run(FloralWhisperApplication.class, args);
  }
}

