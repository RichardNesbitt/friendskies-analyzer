const express = require('express');
const { BskyAgent } = require('@atproto/api');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.post('/api/following', async (req, res) => {
  try {
    const { handle, password } = req.body;
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    
    // Only attempt login if password is provided
    if (password) {
      await agent.login({ identifier: handle, password });
    }

    // Get user DID
    const response = await agent.getProfile({ actor: handle });
    const did = response.data.did;

    // Get following list
    const following = [];
    let cursor;
    
    do {
      const followsResponse = await agent.getFollows({ actor: did, cursor });
      
      for (const profile of followsResponse.data.follows) {
        // Get their last post
        const posts = await agent.getAuthorFeed({ actor: profile.handle, limit: 1 });
        const lastPost = posts.data.feed[0]?.post.record.createdAt || 'No posts';
        
        // Check if they follow back
        const relationship = await agent.getProfile({
          actor: profile.handle,
        });
        
        following.push({
          handle: profile.handle,
          name: profile.displayName,
          lastPost,
          followsBack: relationship.data.viewer?.following || false,
        });
      }
      
      cursor = followsResponse.data.cursor;
    } while (cursor);

    res.json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/unfollow', async (req, res) => {
  try {
    const { handle, password, unfollowHandle } = req.body;
    const agent = new BskyAgent({ service: 'https://bsky.social' });
    
    await agent.login({ identifier: handle, password });
    await agent.deleteFollow(unfollowHandle);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});