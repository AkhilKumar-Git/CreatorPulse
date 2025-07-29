'use client'

import { useUser } from "@/lib/user-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import { createBrowserClient } from "@/lib/supabase-client";
import { TrendCard } from "@/components/ui/trend-card";
import { AvatarCircles } from "@/components/ui/avatar-circles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Search, Filter } from "lucide-react";
import type { RankedTrend } from "@/lib/trend-ranking";
import { getFaviconUrl } from "@/lib/favicon-utils";

interface Source {
  id: string;
  type: string;
  url?: string;
  content?: string;
  created_at: string;
}

interface Trend {
  topic: string;
  explainer: string;
  link: string;
  confidence: number;
  timestamp: string;
}

interface TrendsResponse {
  success: boolean;
  trends: Trend[];
  rankedTrends: RankedTrend[];
  metadata: {
    userSources: number;
    globalIncluded: boolean;
    trendsFound: number;
    rankedTrendsFound: number;
    timeWindow: string;
    categories: string;
    scoring: {
      recencyWeight: number;
      popularityWeight: number;
      engagementWeight: number;
      topScore: number;
    };
  };
}

export default function Home() {
  const { user, loading, signOut } = useUser();
  const router = useRouter();
  const supabase = createBrowserClient();
  const [sources, setSources] = useState<Source[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [rankedTrends, setRankedTrends] = useState<RankedTrend[]>([]);
  const [metadata, setMetadata] = useState<TrendsResponse['metadata'] | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [addingSource, setAddingSource] = useState(false);
  const [sourcesLoaded, setSourcesLoaded] = useState(false);
  const [newSource, setNewSource] = useState({ type: 'x', url: '', content: '' });
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [trendsDetected, setTrendsDetected] = useState(false);

  const getAuthToken = async () => {
    // Get the actual session token from Supabase
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const loadSources = useCallback(async () => {
    console.log('Loading sources...');
    setLoadingSources(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        console.log('No auth token available, skipping sources load');
        setLoadingSources(false);
        return;
      }
      
      console.log('Making API request to load sources...');
      const response = await fetch('/api/sources/connect', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Sources data:', data);
        if (data.success) {
          setSources(data.sources || []);
          setSourcesLoaded(true);
          console.log('Sources loaded successfully:', data.sources?.length || 0);
        }
      } else if (response.status === 401) {
        console.log('User not authenticated, skipping sources load');
        // Don't show error for auth issues
      } else {
        console.error('Failed to load sources:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        
        // Show user-friendly error message
        if (errorData.message?.includes('Sources table not found')) {
          alert('Database not set up. Please run the database setup script first.');
        }
      }
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      console.log('Setting loading to false');
      setLoadingSources(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load user's sources only (trends will be loaded manually)
  useEffect(() => {
    if (user && !sourcesLoaded && !loadingSources) {
      console.log('User changed, loading sources...');
      loadSources();
    }
    
    // Reset sources when user changes
    return () => {
      if (!user) {
        setSources([]);
        setSourcesLoaded(false);
        setLoadingSources(false);
      }
    };
  }, [user, sourcesLoaded, loadingSources, loadSources]);

  const addSource = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding source:', newSource);
    
    // Validate input
    if (!newSource.type || (!newSource.url && !newSource.content)) {
      alert('Please fill in all required fields');
      return;
    }
    
    setAddingSource(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to add sources');
        return;
      }
      
      console.log('Making API request to add source...');
      const response = await fetch('/api/sources/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSource)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        setNewSource({ type: 'x', url: '', content: '' });
        setSourcesLoaded(false); // Reset to reload sources
        alert('Source added successfully!');
        loadSources();
      } else {
        console.error('Failed to add source:', data.error || response.statusText);
        alert(`Failed to add source: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding source:', error);
      alert('Error adding source. Please try again.');
    } finally {
      setAddingSource(false);
    }
  };

  const deleteSource = async (sourceId: string) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to delete sources');
        return;
      }
      
      const response = await fetch(`/api/sources/connect?id=${sourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setSources(sources.filter(s => s.id !== sourceId));
        alert('Source deleted successfully!');
      } else {
        alert('Failed to delete source');
      }
    } catch (error) {
      console.error('Error deleting source:', error);
      alert('Error deleting source. Please try again.');
    }
  };

  const deleteTrend = (trendId: string) => {
    setRankedTrends(rankedTrends.filter(t => t.id !== trendId));
  };

  const detectTrends = async () => {
    // Check if user has sources first
    if (sources.length === 0) {
      alert('Please add some sources first before detecting trends.');
      return;
    }
    
    setLoadingTrends(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        alert('Please log in to detect trends');
        return;
      }
      
      const response = await fetch('/api/trends/detect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data: TrendsResponse = await response.json();
      
      if (response.ok && data.success) {
        setTrends(data.trends || []);
        setRankedTrends(data.rankedTrends || []);
        setMetadata(data.metadata);
        setTrendsDetected(true);
        alert(`Successfully detected ${data.rankedTrends?.length || 0} ranked trends!`);
      } else {
        console.error('Failed to detect trends:', response.statusText);
        alert('Failed to detect trends. Check console for details.');
      }
    } catch (error) {
      console.error('Error detecting trends:', error);
      alert('Error detecting trends. Please try again.');
    } finally {
      setLoadingTrends(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const filteredTrends = filterCategory === 'all' 
    ? rankedTrends 
    : rankedTrends.filter(trend => trend.category === filterCategory);

  // Generate avatar URLs from actual sources using favicons
  const sourceAvatars = sources.map(source => getFaviconUrl(source)).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              CreatorPulse
            </h1>
            <span className="text-sm text-muted-foreground">
              Welcome, {user.email}
            </span>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>
      </header>
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Add Source Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Content Source
            </CardTitle>
            <CardDescription>
              Connect X accounts, YouTube channels, or news websites to track trending content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addSource} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select
                  value={newSource.type}
                  onChange={(e) => setNewSource({ ...newSource, type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="x">X (Twitter) Account</option>
                  <option value="x_hashtag">X Hashtag</option>
                  <option value="youtube">YouTube Channel</option>
                  <option value="url">Website/RSS</option>
                </select>
                <input
                  type="url"
                  placeholder="URL (optional)"
                  value={newSource.url}
                  onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <input
                  type="text"
                  placeholder="Content (e.g., @username, #AI)"
                  value={newSource.content}
                  onChange={(e) => setNewSource({ ...newSource, content: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button type="submit" disabled={addingSource} className="w-full md:w-auto">
                {addingSource ? 'Adding...' : 'Add Source'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sources List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Your Sources</CardTitle>
                <CardDescription>
                  {sources.length} source{sources.length !== 1 ? 's' : ''} connected
                </CardDescription>
              </div>
              {loadingSources && <span className="text-sm text-muted-foreground">Loading...</span>}
            </div>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sources added yet. Add a source above to get started.
              </p>
            ) : (
              <div className="grid gap-3">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{source.type}</span>
                          {source.content && (
                            <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md">
                              {source.content}
                            </span>
                          )}
                        </div>
                        {source.url && (
                          <p className="text-sm text-muted-foreground mt-1">{source.url}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(source.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSource(source.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Detection */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Trend Detection
                </CardTitle>
                <CardDescription>
                  {metadata && (
                    <span>
                      {metadata.rankedTrendsFound} trends • {metadata.timeWindow} window
                      {metadata.globalIncluded && " • Global trends included"}
                    </span>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {rankedTrends.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="flex h-10 w-auto min-w-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="all">All Categories</option>
                      <option value="technology">Technology</option>
                      <option value="business">Business</option>
                      <option value="social">Social</option>
                      <option value="entertainment">Entertainment</option>
                      <option value="science">Science</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                )}
                <Button
                  onClick={detectTrends}
                  disabled={loadingTrends}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  {loadingTrends ? 'Detecting...' : 'Detect Trends'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTrends && (
              <div className="text-sm text-muted-foreground mb-6 p-4 bg-primary/5 rounded-lg border-l-4 border-primary">
                🔍 Crawling sources and analyzing trends... This may take a few moments.
              </div>
            )}
            
            {filteredTrends.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">
                  {sources.length === 0 
                    ? "No sources added yet"
                    : rankedTrends.length === 0 
                      ? "No trends detected yet"
                      : "No trends match the selected filter"
                  }
                </p>
                <p className="text-muted-foreground text-sm">
                  {sources.length === 0 
                    ? "Add some sources first, then detect trends"
                    : rankedTrends.length === 0 
                      ? "Click 'Detect Trends' to analyze your sources"
                      : "Try selecting a different category"
                  }
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredTrends.map((trend) => (
                  <TrendCard
                    key={trend.id}
                    trend={trend}
                    onDelete={deleteTrend}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        {metadata && (
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                CreatorPulse Enhanced Trend Detection System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="font-semibold text-green-700">{sources.length}</div>
                  <div className="text-green-600">Sources Connected</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="font-semibold text-blue-700">{metadata.rankedTrendsFound}</div>
                  <div className="text-blue-600">Trends Detected</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="font-semibold text-purple-700">{(metadata.scoring.topScore * 100).toFixed(0)}%</div>
                  <div className="text-purple-600">Top Score</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="font-semibold text-orange-700">{metadata.timeWindow}</div>
                  <div className="text-orange-600">Time Window</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer with Source Avatars - Only show after trends detected */}
      {trendsDetected && sources.length > 0 && (
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <AvatarCircles
                  numPeople={sources.length}
                  avatarUrls={sourceAvatars}
                  className="scale-90"
                />
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{sources.length} sources</span> scanned • <span className="font-medium">{rankedTrends.length} trends</span> detected
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                CreatorPulse • Never start from a blank page again
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
