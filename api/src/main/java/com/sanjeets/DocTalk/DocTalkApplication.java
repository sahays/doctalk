package com.sanjeets.DocTalk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class DocTalkApplication {

	public static void main(String[] args) {
		SpringApplication.run(DocTalkApplication.class, args);
	}

}
