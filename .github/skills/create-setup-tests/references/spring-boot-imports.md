# Spring Boot Import Mapping

## Spring Boot 4.x

- `DataJpaTest` -> `org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest`
- `AutoConfigureTestDatabase` -> `org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase`
- `EntityScan` -> `org.springframework.boot.persistence.autoconfigure.EntityScan`
- `FlywayAutoConfiguration` -> `org.springframework.boot.flyway.autoconfigure.FlywayAutoConfiguration`

## Spring Boot 3.x (typical)

- `DataJpaTest` -> `org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest`
- `AutoConfigureTestDatabase` -> `org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase`
- `EntityScan` -> `org.springframework.boot.autoconfigure.domain.EntityScan`
- `FlywayAutoConfiguration` -> `org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration`
