// ========================================
// SCREENSHOT CAROUSEL COMPONENT
// ========================================
// 
// HOW TO ADD NEW SCREENSHOTS:
// 
// 1. Add your screenshot image to: /client/public/screenshots/
// 2. Add a new entry to the 'screenshots' array below with:
//    - id: unique identifier
//    - title: display name for the feature
//    - description: brief description of what the screenshot shows
//    - imagePath: path relative to /public (e.g., '/screenshots/your-image.png')
//    - category: feature category tag
// 
// 3. The carousel will automatically include your new screenshot in the rotation
//
// CUSTOMIZATION OPTIONS:
// - autoRotate: Enable/disable automatic rotation (default: true)
// - rotationInterval: Time between slides in milliseconds (default: 5000)
//
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  useMediaQuery,
  useTheme,
  Card,
  CardMedia,
  Fade,
  Stack,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  Pause,
  PlayArrow,
} from '@mui/icons-material';

interface Screenshot {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  category: string;
}

const screenshots: Screenshot[] = [
  {
    id: '1',
    title: 'Medical Note Generation',
    description: 'Easily generate medical notes with AriNote',
    imagePath: '/screenshots/dashboard.png',
    category: 'Smart Templates',
  },
  {
    id: '2',
    title: 'Simplified Formatting',
    description: 'AriNote automatically formats your notes for you with easy export options',
    imagePath: '/screenshots/liveupdates.png',
    category: 'Documentation',
  },
  {
    id: '3',
    title: 'AI-powered Medication Extraction and Organization',
    description: 'AriNote automatically extracts and organizes medications from your patient\'s medication list and automatically organizes them for you',
    imagePath: '/screenshots/medications.png',
    category: 'Patient Records',
  },
  {
    id: '4',
    title: 'Laboratory Values',
    description: 'Interactive lab results with smart value tracking',
    imagePath: '/screenshots/laboratory-values.png',
    category: 'Lab Integration',
  },
  {
    id: '5',
    title: 'Medications List',
    description: 'Comprehensive medication management with dosing',
    imagePath: '/screenshots/medications-list.png',
    category: 'Medication Management',
  },
  {
    id: '6',
    title: 'Medication Output',
    description: 'Clean, formatted medication lists for documentation',
    imagePath: '/screenshots/medication-output.png',
    category: 'Output Generation',
  },
  {
    id: '7',
    title: 'Smart Medication Search',
    description: 'Intelligent medication search and autocomplete',
    imagePath: '/screenshots/medications-interface.png',
    category: 'AI-Powered',
  },
];

interface ScreenshotCarouselProps {
  autoRotate?: boolean;
  rotationInterval?: number;
}

const ScreenshotCarousel: React.FC<ScreenshotCarouselProps> = ({
  autoRotate = true,
  rotationInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoRotate);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === screenshots.length - 1 ? 0 : prevIndex + 1
      );
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [isPlaying, rotationInterval]);

  const handlePrevious = () => {
    setCurrentIndex(currentIndex === 0 ? screenshots.length - 1 : currentIndex - 1);
  };

  const handleNext = () => {
    setCurrentIndex(currentIndex === screenshots.length - 1 ? 0 : currentIndex + 1);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const currentScreenshot = screenshots[currentIndex];

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            See AriNote in Action
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Explore our powerful features designed to streamline medical documentation
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 1000, mx: 'auto' }}>
          {/* Main Screenshot Display */}
          <Card
            elevation={8}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            }}
          >
            <Box sx={{ position: 'relative', height: { xs: 300, md: 500 } }}>
              <Fade in={true} timeout={500} key={currentIndex}>
                <CardMedia
                  component="img"
                  image={currentScreenshot.imagePath}
                  alt={currentScreenshot.title}
                  sx={{
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                  }}
                />
              </Fade>
              
              {/* Navigation Arrows */}
              <IconButton
                onClick={handlePrevious}
                sx={{
                  position: 'absolute',
                  left: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
              
              <IconButton
                onClick={handleNext}
                sx={{
                  position: 'absolute',
                  right: 16,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)',
                  },
                }}
              >
                <ArrowForward />
              </IconButton>

              {/* Play/Pause Button */}
              <IconButton
                onClick={togglePlayPause}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                  },
                }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Box>
          </Card>

          {/* Screenshot Info */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
              {currentScreenshot.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              {currentScreenshot.description}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'primary.main',
                fontWeight: 600,
                bgcolor: 'primary.50',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                display: 'inline-block',
              }}
            >
              {currentScreenshot.category}
            </Typography>
          </Box>

          {/* Dot Navigation */}
          <Stack
            direction="row"
            justifyContent="center"
            alignItems="center"
            spacing={1}
            sx={{ mt: 4 }}
          >
            {screenshots.map((_, index) => (
              <Box
                key={index}
                onClick={() => handleDotClick(index)}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: index === currentIndex ? 'primary.main' : 'grey.300',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: index === currentIndex ? 'primary.dark' : 'grey.400',
                    transform: 'scale(1.1)',
                  },
                }}
              />
            ))}
          </Stack>

          {/* Screenshot Counter */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: 'center', mt: 2 }}
          >
            {currentIndex + 1} of {screenshots.length}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ScreenshotCarousel;