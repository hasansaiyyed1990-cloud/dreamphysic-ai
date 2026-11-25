package com.fitforge.ai;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Persisted AI advisory exchange, pruned to the newest messages per user. */
@Entity @Table(name="ai_chat_messages",indexes=@Index(name="idx_ai_chat_owner_created",columnList="user_email,created_at"))
public class AiChatMessage {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_email",nullable=false,length=190) private String userEmail;
    @Column(nullable=false,length=40) private String kind;
    @Column(columnDefinition="text") private String prompt;
    @Column(columnDefinition="text") private String response;
    @Column(name="created_at",nullable=false) private LocalDateTime createdAt;

    protected AiChatMessage(){}

    public AiChatMessage(String userEmail,String kind,String prompt,String response){
        this.userEmail=userEmail;
        this.kind=kind;
        this.prompt=prompt;
        this.response=response;
        this.createdAt=LocalDateTime.now(java.time.ZoneId.of("Asia/Kolkata"));
    }

    public Long getId(){return id;}
    public String getUserEmail(){return userEmail;}
    public String getKind(){return kind;}
    public String getPrompt(){return prompt;}
    public String getResponse(){return response;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
