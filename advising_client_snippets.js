/**
 * Advising Feature Client Snippets (Supabase v2)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient('YOUR_URL', 'YOUR_KEY');

// 1. Typeahead User Search
// Efficient search across profiles with simple debouncing
async function searchUsers(query) {
    if (!query) return [];
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .ilike('email', `%${query}%`) // or ilike('full_name', ...)
        .limit(10); // always limit typeahead results

    if (error) {
        console.error('Error searching users:', error);
        return [];
    }
    return data;
}

// 2. Batch Tagging (Using RPC)
// Validated server-side assignment
async function tagUsersToSession(sessionId, userIds) {
    const { error } = await supabase.rpc('bulk_tag_users', {
        p_session_id: sessionId,
        p_user_ids: userIds,
    });

    if (error) throw error;
    console.log('Users tagged successfully');
}

// 2b. Batch Tagging (Direct Insert - Client Side Loop optimization)
// Only use if RPC is not an option. Note: RLS must allow inserts.
async function tagUsersDirect(sessionId, userIds) {
    const rows = userIds.map(uid => ({
        session_id: sessionId,
        user_id: uid
    }));

    const { error } = await supabase
        .from('session_user_tags')
        .upsert(rows, { onConflict: 'session_id, user_id', ignoreDuplicates: true });

    if (error) throw error;
}


// 3. Scoped Realtime Subscription
// Listen ONLY for messages in a specific session
function subscribeToSession(sessionId, onMessage) {
    const channel = supabase
        .channel(`session:${sessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'session_messages',
                filter: `session_id=eq.${sessionId}`,
            },
            (payload) => {
                console.log('New message:', payload.new);
                onMessage(payload.new);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// 4. Optimistic UI Example (React Query style pseudo-code)
/*
const queryClient = useQueryClient();

const sendMessageMutation = useMutation({
  mutationFn: async ({ sessionId, content }) => {
    return supabase.from('session_messages').insert({ session_id: sessionId, content });
  },
  onMutate: async (newMessage) => {
    await queryClient.cancelQueries(['messages', newMessage.sessionId]);
    const previousMessages = queryClient.getQueryData(['messages', newMessage.sessionId]);
    
    // Optimistically update to the new value
    queryClient.setQueryData(['messages', newMessage.sessionId], (old) => [
        ...(old || []), 
        { id: 'temp-id', ...newMessage, created_at: new Date().toISOString() }
    ]);
    
    return { previousMessages };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['messages', newTodo.sessionId], context.previousMessages);
  },
  onSettled: (data, error, variables) => {
    queryClient.invalidateQueries(['messages', variables.sessionId]);
  }
});
*/
