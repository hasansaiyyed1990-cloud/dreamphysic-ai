package com.fitforge.ai;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AiChatHistoryService {
    /** Keep only the newest exchanges so the table cannot grow without bound. */
    public static final int MAX_MESSAGES_PER_USER = 80;

    private final AiChatMessageRepository repo;

    public AiChatHistoryService(AiChatMessageRepository repo){this.repo=repo;}

    @Transactional
    public void record(String email,String kind,String prompt,String response){
        if(email==null||email.isBlank())return;
        if(response==null||response.isBlank())return;
        repo.save(new AiChatMessage(email,kind,prompt,response));
        prune(email);
    }

    private void prune(String email){
        List<AiChatMessage> overflow=repo.findByUserEmailOrderByCreatedAtDescIdDesc(
                email,PageRequest.of(0,MAX_MESSAGES_PER_USER+200));
        if(overflow.size()<=MAX_MESSAGES_PER_USER)return;
        List<AiChatMessage> stale=overflow.subList(MAX_MESSAGES_PER_USER,overflow.size());
        repo.deleteAllInBatch(stale);
    }
}
