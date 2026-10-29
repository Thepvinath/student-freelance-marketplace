package com.studentfreelance.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RoleTestController {

    @GetMapping("/api/test/student")
    public String student() {
        return "STUDENT API OK";
    }

    @GetMapping("/api/test/employer")
    public String employer() {
        return "EMPLOYER API OK";
    }

    @GetMapping("/api/test/admin")
    public String admin() {
        return "ADMIN API OK";
    }
}
