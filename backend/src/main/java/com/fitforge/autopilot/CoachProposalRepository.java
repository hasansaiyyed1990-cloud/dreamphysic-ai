package com.fitforge.autopilot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CoachProposalRepository extends JpaRepository<CoachProposal,Long>{List<CoachProposal> findByUserEmailOrderByCreatedAtDesc(String email);Optional<CoachProposal> findByIdAndUserEmail(Long id,String email);}
