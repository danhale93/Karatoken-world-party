// Powered by OnSpace.AI
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSongStore } from '../../hooks/useSongStore';
import { GenreSwappingAdvanced } from '../../services/genreSwappingAdvanced';
import { YouTubeSearchResult, youtubeSearchService } from '../../services/youtubeSearchService';

const { width } = Dimensions.get('window');

interface Song {
  id: string;
  title: string;
  artist: string;
  albumArt?: string;
  duration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  genre: string;
  rating: number;
  playCount: number;
  lyrics?: string;
  backingTrackUrl?: string;
  createdAt: string;
  isFavorite?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function SongSelectionScreen() {
  const { songs, searchSongs, getFeaturedSongs, getPopularSongs } = useSongStore();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'featured' | 'popular' | 'trending' | 'favorites' | 'youtube'>('featured');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  
  // YouTube Search State
  const [youtubeResults, setYoutubeResults] = useState<YouTubeSearchResult[]>([]);
  const [showYoutubeSearch, setShowYoutubeSearch] = useState(false);
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  
  // Genre Swapping State
  const [showGenreSwap, setShowGenreSwap] = useState(false);
  const [selectedSongForGenreSwap, setSelectedSongForGenreSwap] = useState<Song | null>(null);
  const [genreSwapLoading, setGenreSwapLoading] = useState(false);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  
  // Genre Swapping Service
  const genreSwappingService = GenreSwappingAdvanced.getInstance();

  const categories: Category[] = [
    { id: 'pop', name: 'Pop', icon: 'favorite', color: '#EC4899' },
    { id: 'rock', name: 'Rock', icon: 'flash-on', color: '#EF4444' },
    { id: 'hip-hop', name: 'Hip-Hop', icon: 'mic', color: '#8B5CF6' },
    { id: 'country', name: 'Country', icon: 'landscape', color: '#F59E0B' },
    { id: 'jazz', name: 'Jazz', icon: 'piano', color: '#10B981' },
    { id: 'classical', name: 'Classical', icon: 'music-note', color: '#3B82F6' },
    { id: 'r&b', name: 'R&B', icon: 'favorite-border', color: '#8B5CF6' },
    { id: 'electronic', name: 'Electronic', icon: 'graphic-eq', color: '#06B6D4' },
  ];

  useEffect(() => {
    loadSongs();
    animateIn();
  }, [selectedCategory, selectedGenre]);

  const animateIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const loadSongs = async () => {
    setLoading(true);
    try {
      switch (selectedCategory) {
        case 'featured':
          await getFeaturedSongs();
          break;
        case 'popular':
          await getPopularSongs();
          break;
        case 'trending':
          await getFeaturedSongs(); // Use featured for now
          break;
        case 'favorites':
          // Handle favorites separately
          break;
      }
    } catch (error) {
      console.error('Error loading songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    await loadSongs();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      await searchSongs(searchQuery);
    } catch (error) {
      Alert.alert('Error', 'Failed to search songs');
    } finally {
      setLoading(false);
    }
  };

  // YouTube Search Functions
  const handleYoutubeSearch = async () => {
    if (!youtubeSearchQuery.trim()) return;
    
    setYoutubeLoading(true);
    try {
      const results = await youtubeSearchService.searchSongs(youtubeSearchQuery);
      setYoutubeResults(results);
      setSelectedCategory('youtube');
    } catch (error) {
      Alert.alert('Error', 'Failed to search YouTube');
    } finally {
      setYoutubeLoading(false);
    }
  };

  const handleYoutubeSongSelect = (youtubeResult: YouTubeSearchResult) => {
    // Convert YouTube result to Song format
    const song: Song = {
      id: youtubeResult.videoId,
      title: youtubeResult.title,
      artist: youtubeResult.channelTitle,
      albumArt: youtubeResult.thumbnailUrl,
      duration: parseDuration(youtubeResult.duration),
      difficulty: 'Medium',
      genre: 'pop',
      rating: 4.0,
      playCount: Math.min(youtubeResult.viewCount / 1000, 10000),
      createdAt: new Date().toISOString(),
      isFavorite: false,
    };
    
    handleSelectSong(song);
  };

  // Genre Swapping Functions
  const handleGenreSwap = async (song: Song) => {
    setSelectedSongForGenreSwap(song);
    setShowGenreSwap(true);
    
    try {
      await genreSwappingService.initialize();
      const customGenres = genreSwappingService.getCustomGenres();
      setAvailableGenres([
        'pop', 'rock', 'hip-hop', 'country', 'jazz', 'classical', 'r&b', 'electronic',
        ...customGenres.map(g => g.name)
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to initialize genre swapping');
    }
  };

  const performGenreSwap = async (targetGenre: string) => {
    if (!selectedSongForGenreSwap) return;
    
    setGenreSwapLoading(true);
    try {
      // This would integrate with the actual genre swapping service
      Alert.alert('Genre Swap', `Converting "${selectedSongForGenreSwap.title}" to ${targetGenre} style...`);
      
      // Mock genre swap for now
      setTimeout(() => {
        Alert.alert('Success', `Song converted to ${targetGenre} style!`);
        setShowGenreSwap(false);
        setGenreSwapLoading(false);
      }, 2000);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to perform genre swap');
      setGenreSwapLoading(false);
    }
  };

  // Utility Functions
  const parseDuration = (duration: string): number => {
    // Parse ISO 8601 duration format (PT4M13S) to seconds
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  };

  const handleSelectSong = (song: Song) => {
    if (mode === 'battle') {
      // Navigate to battle creation with selected song
      router.push({
        pathname: '/(tabs)/battle',
        params: { 
          songId: song.id,
          songTitle: song.title,
          artistName: song.artist,
          duration: song.duration.toString(),
        },
      });
    } else {
      // Navigate to karaoke session
      router.push({
        pathname: '/karaoke/[songId]',
        params: { 
          songId: song.id,
          songTitle: song.title,
          artistName: song.artist,
          duration: song.duration.toString(),
          difficulty: song.difficulty,
        },
      });
    }
  };

  const handleFavoriteToggle = async (songId: string) => {
    try {
      // Mock favorite toggle for now
      console.log('Toggle favorite for song:', songId);
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'hard':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSongs = songs.filter(song => 
    selectedGenre === 'all' || song.genre.toLowerCase() === selectedGenre.toLowerCase()
  );

  const renderGenreTab = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[
        styles.genreTab,
        selectedGenre === item.id && { backgroundColor: item.color }
      ]}
      onPress={() => setSelectedGenre(item.id)}
    >
      <MaterialIcons 
        name={item.icon as any} 
        size={20} 
        color={selectedGenre === item.id ? '#FFFFFF' : item.color} 
      />
      <Text style={[
        styles.genreText,
        selectedGenre === item.id && styles.genreTextActive
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderSongCard = ({ item }: { item: Song }) => (
    <TouchableOpacity 
      style={styles.songCard}
      onPress={() => handleSelectSong(item)}
    >
      <Image
        source={{ uri: item.albumArt || 'https://picsum.photos/seed/music/120/120.webp' }}
        style={styles.albumArt}
      />
      <View style={styles.songInfo}>
        <View style={styles.songHeader}>
          <Text style={styles.songTitle} numberOfLines={2}>{item.title}</Text>
          <TouchableOpacity
            onPress={() => handleFavoriteToggle(item.id)}
            style={styles.favoriteButton}
          >
            <MaterialIcons 
              name={item.isFavorite ? 'favorite' : 'favorite-border'} 
              size={20} 
              color={item.isFavorite ? '#EF4444' : '#9CA3AF'} 
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.artistName} numberOfLines={1}>{item.artist}</Text>
        
        <View style={styles.songDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="schedule" size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>{formatDuration(item.duration)}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="star" size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>{item.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.detailItem}>
              <MaterialIcons name="play-circle" size={14} color="#9CA3AF" />
              <Text style={styles.detailText}>{item.playCount}</Text>
            </View>
          </View>
          
          <View style={styles.difficultyContainer}>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(item.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>{item.difficulty.toUpperCase()}</Text>
            </View>
            <View style={styles.popularityContainer}>
              <MaterialIcons name="trending-up" size={14} color="#F59E0B" />
              <Text style={styles.popularityText}>{Math.round((item.playCount / 1000) * 10)}%</Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.playButton}>
        <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.genreSwapButton}
        onPress={() => handleGenreSwap(item)}
      >
        <MaterialIcons name="auto-fix-high" size={20} color="#8B5CF6" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {mode === 'battle' ? 'Select Battle Song' : 'Choose a Song'}
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowYoutubeSearch(true)}
            >
              <MaterialIcons name="youtube-searched-for" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchButton}>
              <MaterialIcons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialIcons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs, artists, or lyrics..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Tabs */}
        <View style={styles.categoryContainer}>
          <FlatList
            data={[
              { id: 'featured', name: 'Featured' },
              { id: 'popular', name: 'Popular' },
              { id: 'trending', name: 'Trending' },
              { id: 'favorites', name: 'Favorites' },
            ]}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  selectedCategory === item.id && styles.categoryTabActive
                ]}
                onPress={() => setSelectedCategory(item.id as any)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === item.id && styles.categoryTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          />
        </View>

        {/* Genre Filter */}
        <View style={styles.genreContainer}>
          <FlatList
            data={categories}
            renderItem={renderGenreTab}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreList}
          />
        </View>

        {/* Songs List */}
        <FlatList
          data={filteredSongs}
          renderItem={renderSongCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.songsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="music-note" size={60} color="#6B7280" />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No songs found' : 'No songs available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Check back later for new songs'
                }
              </Text>
            </View>
          }
        />
      </Animated.View>

      {/* YouTube Search Modal */}
      <Modal
        visible={showYoutubeSearch}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowYoutubeSearch(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>YouTube Search</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="youtube-searched-for" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search YouTube for songs..."
                placeholderTextColor="#9CA3AF"
                value={youtubeSearchQuery}
                onChangeText={setYoutubeSearchQuery}
                onSubmitEditing={handleYoutubeSearch}
                returnKeyType="search"
              />
              {youtubeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setYoutubeSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={youtubeResults}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.youtubeResultCard}
                onPress={() => handleYoutubeSongSelect(item)}
              >
                <Image source={{ uri: item.thumbnailUrl }} style={styles.youtubeThumbnail} />
                <View style={styles.youtubeInfo}>
                  <Text style={styles.youtubeTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.youtubeChannel}>{item.channelTitle}</Text>
                  <Text style={styles.youtubeDuration}>{item.duration}</Text>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.videoId}
            contentContainerStyle={styles.youtubeResultsList}
            ListEmptyComponent={
              youtubeLoading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Searching YouTube...</Text>
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>Search for songs on YouTube</Text>
                </View>
              )
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Genre Swap Modal */}
      <Modal
        visible={showGenreSwap}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGenreSwap(false)}>
              <MaterialIcons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Genre Swap</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {selectedSongForGenreSwap && (
            <View style={styles.genreSwapSongInfo}>
              <Text style={styles.genreSwapTitle}>Convert &quot;{selectedSongForGenreSwap.title}&quot; to:</Text>
            </View>
          )}

          <FlatList
            data={availableGenres}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.genreOption}
                onPress={() => performGenreSwap(item)}
                disabled={genreSwapLoading}
              >
                <Text style={styles.genreOptionText}>{item}</Text>
                {genreSwapLoading && (
                  <MaterialIcons name="hourglass-empty" size={20} color="#9CA3AF" />
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.genreOptionsList}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 10,
  },
  categoryContainer: {
    marginBottom: 15,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 15,
    borderRadius: 20,
    backgroundColor: '#1F2937',
  },
  categoryTabActive: {
    backgroundColor: '#10B981',
  },
  categoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  genreContainer: {
    marginBottom: 15,
  },
  genreList: {
    paddingHorizontal: 20,
  },
  genreTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  genreText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 6,
    fontWeight: '600',
  },
  genreTextActive: {
    color: '#FFFFFF',
  },
  songsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  songCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  albumArt: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  songInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  songHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  songTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 10,
  },
  favoriteButton: {
    padding: 4,
  },
  artistName: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  songDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  popularityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularityText: {
    fontSize: 12,
    color: '#F59E0B',
    marginLeft: 4,
    fontWeight: '600',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  genreSwapButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  youtubeResultCard: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  youtubeThumbnail: {
    width: 100,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  youtubeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  youtubeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  youtubeChannel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  youtubeDuration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  youtubeResultsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  genreSwapSongInfo: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  genreSwapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  genreOptionsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  genreOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  genreOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
});