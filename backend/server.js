const express = require('express');
const { BskyAgent } = require('@atproto/api');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Add this debug log
console.log('Setting up routes...');

// Your existing following endpoint
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

// Add debug log for unfollow endpoint
console.log('Adding unfollow endpoint...');

app.post('/api/unfollow', async (req, res) => {
    console.log('Received unfollow request:', req.body);
    try {
      const { handle, password, unfollowHandle } = req.body;
      const agent = new BskyAgent({ service: 'https://bsky.social' });
      
      console.log('Attempting login...');
      await agent.login({ identifier: handle, password });
      console.log('Login successful');
      
      console.log('Getting profile for:', unfollowHandle);
      const profileToUnfollow = await agent.getProfile({ actor: unfollowHandle });
      console.log('Found profile, DID:', profileToUnfollow.data.did);
      
      // Get current user's follows
      const { data: { follows } } = await agent.getFollows({
        actor: agent.session.did,
        limit: 100
      });
      
      console.log('Looking for follow relationship...');
      const followRecord = follows.find(f => f.did === profileToUnfollow.data.did);
      
      if (!followRecord) {
        console.log('Follow relationship not found');
        return res.status(404).json({ error: 'Follow relationship not found' });
      }
      
      console.log('Found follow record:', followRecord.uri);
      await agent.deleteFollow(followRecord.uri);
      console.log('Successfully unfollowed');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Detailed error:', error);
      res.status(500).json({ 
        error: error.message,
        stack: error.stack 
      });
    }
  });
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });