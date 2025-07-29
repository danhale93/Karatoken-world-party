import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../hooks/useAuthStore';
import { usePerformanceStore } from '../hooks/usePerformanceStore';

const { width } = Dimensions.get('window');

interface SocialPost {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  performanceId: string;
  songTitle: string;
  artistName: string;
  score: number;
  thumbnailUrl: string;
  videoUrl: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked: boolean;
  isFollowing: boolean;
}

interface Comment {
  id: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL: string;
  text: string;
  createdAt: string;
}

export default function SocialFeedScreen() {
  const { user } = useAuthStore();
  const { getPerformances } = usePerformanceStore();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSocialFeed();
  }, []);

  const loadSocialFeed = async () => {
    try {
      setLoading(true);
      // Mock social feed data
      const mockPosts: SocialPost[] = [
        {
          id: '1',
          userId: 'user1',
          userDisplayName: 'Sarah Johnson',
          userPhotoURL: 'https://picsum.photos/seed/user1/60/60.webp',
          performanceId: 'perf1',
          songTitle: 'Bohemian Rhapsody',
          artistName: 'Queen',
          score: 95,
          thumbnailUrl: 'https://picsum.photos/seed/bohemian/300/200.webp',
          videoUrl: 'https://example.com/video1.mp4',
          caption: 'Just nailed this classic! 🎤✨',
          likes: 42,
          comments: 8,
          shares: 3,
          createdAt: '2 hours ago',
          isLiked: false,
          isFollowing: true,
        },
        {
          id: '2',
          userId: 'user2',
          userDisplayName: 'Mike Chen',
          userPhotoURL: 'https://picsum.photos/seed/user2/60/60.webp',
          performanceId: 'perf2',
          songTitle: 'Shape of You',
          artistName: 'Ed Sheeran',
          score: 88,
          thumbnailUrl: 'https://picsum.photos/seed/shape/300/200.webp',
          videoUrl: 'https://example.com/video2.mp4',
          caption: 'Love this song! Perfect for karaoke night 🎵',
          likes: 28,
          comments: 5,
          shares: 2,
          createdAt: '4 hours ago',
          isLiked: true,
          isFollowing: false,
        },
        {
          id: '3',
          userId: 'user3',
          userDisplayName: 'Emma Davis',
          userPhotoURL: 'https://picsum.photos/seed/user3/60/60.webp',
          performanceId: 'perf3',
          songTitle: 'Rolling in the Deep',
          artistName: 'Adele',
          score: 92,
          thumbnailUrl: 'https://picsum.photos/seed/rolling/300/200.webp',
          videoUrl: 'https://example.com/video3.mp4',
          caption: 'Adele is my spirit animal! 🎤❤️',
          likes: 67,
          comments: 12,
          shares: 7,
          createdAt: '6 hours ago',
          isLiked: false,
          isFollowing: true,
        },
      ];
      
      setPosts(mockPosts);
    } catch (error) {
      console.error('Error loading social feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSocialFeed();
    setRefreshing(false);
  };

  const handleLike = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleFollow = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? { ...post, isFollowing: !post.isFollowing }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      setShowComments(true);
      // Mock comments
      setComments([
        {
          id: '1',
          userId: 'user4',
          userDisplayName: 'Alex Wilson',
          userPhotoURL: 'https://picsum.photos/seed/user4/40/40.webp',
          text: 'Amazing performance! 👏',
          createdAt: '1 hour ago',
        },
        {
          id: '2',
          userId: 'user5',
          userDisplayName: 'Lisa Brown',
          userPhotoURL: 'https://picsum.photos/seed/user5/40/40.webp',
          text: 'Love your voice! 🎵',
          createdAt: '30 minutes ago',
        },
      ]);
    }
  };

  const addComment = () => {
    if (newComment.trim() && selectedPost) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: user?.id || '',
        userDisplayName: user?.displayName || 'You',
        userPhotoURL: user?.photoURL || 'https://picsum.photos/seed/you/40/40.webp',
        text: newComment.trim(),
        createdAt: 'Just now',
      };
      setComments(prev => [comment, ...prev]);
      setNewComment('');
    }
  };

  const renderPost = ({ item }: { item: SocialPost }) => (
    <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image source={{ uri: item.userPhotoURL }} style={styles.userPhoto} />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.userDisplayName}</Text>
            <Text style={styles.postTime}>{item.createdAt}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.followButton, item.isFollowing && styles.followingButton]}
          onPress={() => handleFollow(item.id)}
        >
          <Text style={[styles.followText, item.isFollowing && styles.followingText]}>
            {item.isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Performance Info */}
      <View style={styles.performanceInfo}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7']}
          style={styles.scoreBadge}
        >
          <Text style={styles.scoreText}>{item.score}%</Text>
        </LinearGradient>
        <View style={styles.songInfo}>
          <Text style={styles.songTitle}>{item.songTitle}</Text>
          <Text style={styles.artistName}>{item.artistName}</Text>
        </View>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Image source={{ uri: item.thumbnailUrl }} style={styles.postImage} />
        <Text style={styles.caption}>{item.caption}</Text>
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <MaterialIcons
            name={item.isLiked ? 'favorite' : 'favorite-border'}
            size={24}
            color={item.isLiked ? '#EF4444' : '#9CA3AF'}
          />
          <Text style={styles.actionText}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleComment(item.id)}
        >
          <MaterialIcons name="chat-bubble-outline" size={24} color="#9CA3AF" />
          <Text style={styles.actionText}>{item.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="share" size={24} color="#9CA3AF" />
          <Text style={styles.actionText}>{item.shares}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton}>
          <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <Image source={{ uri: item.userPhotoURL }} style={styles.commentUserPhoto} />
      <View style={styles.commentContent}>
        <Text style={styles.commentUserName}>{item.userDisplayName}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <Text style={styles.commentTime}>{item.createdAt}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Social Feed</Text>
        <TouchableOpacity style={styles.createButton}>
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.feedContainer}
      />

      {/* Comments Modal */}
      {showComments && selectedPost && (
        <View style={styles.commentsModal}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setShowComments(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
          />
          
          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment..."
              placeholderTextColor="#9CA3AF"
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
              onPress={addComment}
              disabled={!newComment.trim()}
            >
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedContainer: {
    paddingBottom: 20,
  },
  postContainer: {
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  postTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  followingButton: {
    backgroundColor: '#10B981',
  },
  followText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingText: {
    color: '#FFFFFF',
  },
  performanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 12,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  songInfo: {
    flex: 1,
  },
  songTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  artistName: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  postContent: {
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  caption: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginLeft: 4,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  commentsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentsList: {
    maxHeight: 300,
  },
  commentContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  commentUserPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentTime: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  commentInput: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 12,
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
  },
}); 