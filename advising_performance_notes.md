# Performance & UX Notes for Advising Feature

## Database & Performance
1.  **Indexes**:
    -   `advising_sessions(created_by)`: Speeds up "My Created Sessions" queries for admins.
    -   `session_user_tags(user_id)`: Critical for RLS checks ("Users can view sessions they are tagged in").
    -   `session_messages(session_id, created_at)`: Optimizes loading chat history in chronological order.
    
2.  **Pagination**:
    -   Use **Keyset Pagination** (cursor-based) for the session list, especially if you expect thousands of archived sessions. `created_at` or `id` navigation is faster than `OFFSET/LIMIT`.
    -   For `session_messages`, infinite scroll with `limit(50)` ordered by `created_at` desc is recommended.

3.  **Batch Operations**:
    -   The `bulk_tag_users` RPC minimizes network round-trips. It validates 100+ users in a single database call rather than 100 separate HTTP requests.

## User Experience (UX)
1.  **Optimistic UI**:
    -   When sending a message, display it immediately in the chat list with a "sending..." state/opacity before the server confirms.
    -   For tagging users, show them as "added" instantly. If the RPC fails, show a toast error and revert.

2.  **Debouncing**:
    -   Debounce the User Typeahead search input by at least **300ms** to avoid flooding the database with partial queries (e.g., searching for "j", "jo", "joh", "john").

3.  **Realtime Feedback**:
    -   Use `supabase.channel` to show "New message" indicators if the user is scrolled up in the chat.

4.  **Virtualization**:
    -   If a session allows 1000+ users, use a virtualized list (e.g., `react-window`) to render the "Tagged Users" list to keep the DOM light.
