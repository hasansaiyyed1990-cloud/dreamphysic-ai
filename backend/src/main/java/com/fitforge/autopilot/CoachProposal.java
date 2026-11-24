package com.fitforge.autopilot;
import jakarta.persistence.*;
import java.time.*;
@Entity @Table(name="autopilot_proposals", indexes=@Index(name="idx_autopilot_proposal_user_created",columnList="user_email,created_at"))
public class CoachProposal {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_email",nullable=false,length=190) private String userEmail;
 @Column(nullable=false,length=40) private String type;
 @Column(nullable=false,length=20) private String status;
 @Column(name="proposal_json",nullable=false,columnDefinition="text") private String proposalJson;
 @Column(name="created_at",nullable=false) private LocalDateTime createdAt;
 protected CoachProposal(){}
 public CoachProposal(String email,String type,String json){this.userEmail=email;this.type=type;this.proposalJson=json;this.status="PENDING";this.createdAt=LocalDateTime.now();}
 public Long getId(){return id;} public String getUserEmail(){return userEmail;} public String getType(){return type;} public String getStatus(){return status;} public String getProposalJson(){return proposalJson;} public LocalDateTime getCreatedAt(){return createdAt;} public void decide(String status,String json){this.status=status;this.proposalJson=json;}
}
