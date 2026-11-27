package com.fitforge;

import com.fitforge.auth.AuthDtos;
import com.fitforge.auth.AuthService;
import com.fitforge.auth.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Import(ProductionCriticalScenariosTest.TestAiConfiguration.class)
class AuthIntegrationTest {

    @Autowired private AuthService authService;

    @Test
    void registerAndLoginEndToEnd() {
        String email = "BetaUser-" + UUID.randomUUID() + "@Example.com";
        var reg = authService.register(new AuthDtos.Credentials("  " + email + " ", "secret12", "Beta Tester", null, null));

        assertThat(reg.token()).isNotBlank();
        assertThat(reg.email()).isEqualTo(email.toLowerCase());
        assertThat(reg.name()).isEqualTo("Beta Tester");
        assertThat(reg.user()).isNotNull();
        assertThat(reg.user().id()).isNotNull();

        var loggedIn = authService.login(new AuthDtos.Credentials(email.toUpperCase(), "secret12", null, null, null));
        assertThat(loggedIn.token()).isNotBlank();
        assertThat(loggedIn.userId()).isEqualTo(reg.userId());

        assertThatThrownBy(() -> authService.register(new AuthDtos.Credentials(email, "secret12", "Dup", null, null)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));

        assertThatThrownBy(() -> authService.login(new AuthDtos.Credentials(email, "wrongpass", null, null, null)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void jwtServiceHandlesShortOrBlankSecretDeterministically() {
        JwtService blankKeySvc = new JwtService("", 604800000L);
        JwtService shortKeySvc = new JwtService("short-secret", 604800000L);

        var user = new com.fitforge.auth.AppUser("Test", "test@example.com", "hash");
        String t1 = blankKeySvc.issue(user);
        String t2 = shortKeySvc.issue(user);

        assertThat(blankKeySvc.valid(t1, user)).isTrue();
        assertThat(shortKeySvc.valid(t2, user)).isTrue();
    }
}
