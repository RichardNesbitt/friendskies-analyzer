// frontend/components/bluesky/analyzer.tsx
"use client"

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { BlueskyUser, BlueskyAnalyzerProps } from "@/types/bluesky";
import { cn } from "@/lib/utils";

export function BlueskyAnalyzer({ className }: BlueskyAnalyzerProps) {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [following, setFollowing] = useState<BlueskyUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [unfollowedUsers, setUnfollowedUsers] = useState<Set<string>>(new Set())

  const fetchFollowing = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:3001/api/following', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch data');
      }
      
      const data = await response.json();
      setFollowing(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (unfollowHandle: string) => {
    if (!password) {
      setError('Password required for unfollowing');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3001/api/unfollow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ handle, password, unfollowHandle }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unfollow');
      }

      // Add to unfollowed set
      setUnfollowedUsers(prev => new Set([...prev, unfollowHandle]))
      
      // Refresh the list
      // await fetchFollowing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const sortData = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...following].sort((a, b) => {
      const aValue = key === 'lastPost' ? new Date(a[key] || '').getTime() : a[key];
      const bValue = key === 'lastPost' ? new Date(b[key] || '').getTime() : b[key];
      if (aValue === bValue) return 0;
      return direction === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });

    setFollowing(sortedData);
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Bluesky Network Analyzer</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <Input
            type="text"
            placeholder="Enter your handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <Input
            type="password"
            placeholder="App password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button 
            onClick={fetchFollowing} 
            disabled={loading || !handle}
            className="whitespace-nowrap"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Handle</th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Follows Back</th>
                <th className="text-left p-2 curosr-pointer" onClick={() => sortData('lastPost')}>
                    Last Post {getSortIndicator('lastPost')}
                </th>
                {password && <th className="text-left p-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
            {following.map((user) => (
                <tr key={user.handle} className="border-b">
                    <td className="p-2">{user.handle}</td>
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.followsBack ? 'Yes' : 'No'}</td>
                    <td className="p-2">
                    {user.lastPost === 'No posts' 
                        ? 'No posts' 
                        : new Date(user.lastPost).toLocaleString()
                    }
                    </td>
                    {password && (
                    <td className="p-2">
                        <Button
                        variant={unfollowedUsers.has(user.handle) ? "secondary" : "destructive"}
                        size="sm"
                        onClick={() => handleUnfollow(user.handle)}
                        disabled={unfollowedUsers.has(user.handle)}
                        >
                        {unfollowedUsers.has(user.handle) ? 'Unfollowed' : 'Unfollow'}
                        </Button>
                    </td>
                    )}
                </tr>
                ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}