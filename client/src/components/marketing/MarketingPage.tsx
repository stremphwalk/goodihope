import React from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '@/contexts/AuthContext';
import ScreenshotCarousel from './ScreenshotCarousel';

// ========================================
// EDITABLE CONTENT CONFIGURATION
// ========================================
// 
// HOW TO CUSTOMIZE YOUR MARKETING PAGE:
// 
// 1. EDIT TEXT CONTENT: Simply modify the values in MARKETING_CONTENT below
// 2. ADD SCREENSHOTS: Place new images in client/public/screenshots/ and update
//    the ScreenshotCarousel component in ScreenshotCarousel.tsx
// 3. CHANGE COLORS/STYLING: Modify the theme object below
// 
// CONTENT SECTIONS:
// - navigation: Header menu items and brand name
// - hero: Main banner with headline, subtext, and call-to-action buttons
// - features: Feature cards with icons, titles, and descriptions
// - cta: Call-to-action section with buttons
// - footer: Footer content and links
// 
// Modify the text below to customize your marketing page content
const MARKETING_CONTENT = {
  // Navigation menu items
  navigation: {
    items: ['Features', 'Pricing', 'About', 'Contact'],
    brandName: 'AriNote',
  },

  // Hero section (main banner)
  hero: {
    badge: 'AI-Powered Medical Documentation',
    headline: 'Streamline Your Medical Documentation',
    subtext: 'Transform your clinical workflow with AI-powered note generation, smart templates, and seamless integration. Save time, reduce errors, and focus on what matters most - your patients.',
    primaryButton: 'Start Free Trial',
    secondaryButton: 'Watch Demo',
    demoCard: {
      title: 'Clinical Note Generated',
      subtitle: 'AI-powered documentation in seconds',
      sampleText: '<strong>Chief Complaint:</strong> Chest pain<br /><strong>History:</strong> 45yo M with acute onset...<br /><strong>Assessment:</strong> Likely anxiety-related...',
    },
  },

  // Features section
  features: {
    title: 'Everything You Need for Medical Documentation',
    subtitle: 'Comprehensive tools designed specifically for healthcare professionals',
    items: [
      {
        title: 'AI-Powered Generation',
        description: 'Advanced AI creates comprehensive medical notes from your input, saving hours of documentation time.',
      },
      {
        title: 'Smart Templates',
        description: 'Pre-built templates for common medical scenarios with intelligent auto-completion.',
      },
      {
        title: 'Real-time Processing',
        description: 'Instant note generation with OCR for medication lists and lab results.',
      },
      {
        title: 'HIPAA Compliant',
        description: 'Enterprise-grade security ensuring patient data protection and compliance.',
      },
      {
        title: 'Cloud Sync',
        description: 'Access your notes anywhere with secure cloud synchronization.',
      },
      {
        title: 'Quality Assurance',
        description: 'Built-in checks and validations to ensure accuracy and completeness.',
      },
    ],
  },

  // Call-to-action section
  cta: {
    title: 'Ready to Transform Your Practice?',
    subtitle: 'Join thousands of healthcare professionals already using AriNote',
    primaryButton: 'Start Your Free Trial',
    secondaryButton: 'Schedule Demo',
  },

  // Footer section
  footer: {
    brandName: 'AriNote',
    description: 'AI-powered medical documentation platform designed for healthcare professionals.',
    sections: {
      product: {
        title: 'Product',
        links: ['Features', 'Pricing', 'Security'],
      },
      company: {
        title: 'Company',
        links: ['About', 'Contact', 'Careers'],
      },
      support: {
        title: 'Support',
        links: ['Help Center', 'Documentation', 'Privacy'],
      },
    },
    copyright: '© 2024 AriNote. All rights reserved.',
  },
};
// ========================================

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Manrope", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '3.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: '2.5rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.4,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
  },
});

const AppAppBar = () => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const auth = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = MARKETING_CONTENT.navigation.items;

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {MARKETING_CONTENT.navigation.brandName}
        </Typography>
        <IconButton>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item} disablePadding>
            <ListItemText primary={item} sx={{ textAlign: 'center' }} />
          </ListItem>
        ))}
      </List>
      <Box sx={{ p: 2 }}>
        <Stack spacing={1}>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => auth.signinRedirect()}
          >
            Sign In
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={() => auth.signinRedirect()}
          >
            Get Started
          </Button>
        </Stack>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
              <LocalHospitalIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 700, color: 'text.primary' }}
              >
                {MARKETING_CONTENT.navigation.brandName}
              </Typography>
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {navItems.map((item) => (
                  <Button key={item} sx={{ color: 'text.primary' }}>
                    {item}
                  </Button>
                ))}
                <Button
                  variant="outlined"
                  onClick={() => auth.signinRedirect()}
                  sx={{ ml: 2 }}
                >
                  Sign In
                </Button>
                <Button
                  variant="contained"
                  onClick={() => auth.signinRedirect()}
                >
                  Get Started
                </Button>
              </Box>
            )}

            {isMobile && (
              <IconButton
                color="inherit"
                onClick={handleDrawerToggle}
                sx={{ color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

const Hero = () => {
  const auth = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f0fdfa 100%)',
        pt: { xs: 12, md: 16 },
        pb: { xs: 8, md: 12 },
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
              <Chip
                label={MARKETING_CONTENT.hero.badge}
                sx={{
                  mb: 3,
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  fontWeight: 600,
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  background: 'linear-gradient(135deg, #1e40af 0%, #059669 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {MARKETING_CONTENT.hero.headline}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                  fontWeight: 400,
                  lineHeight: 1.6,
                }}
              >
                {MARKETING_CONTENT.hero.subtext}
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}
              >
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => auth.signinRedirect()}
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  }}
                >
                  {MARKETING_CONTENT.hero.primaryButton}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ py: 1.5, px: 4, fontSize: '1.1rem' }}
                >
                  {MARKETING_CONTENT.hero.secondaryButton}
                </Button>
              </Stack>
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Paper
                elevation={8}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  maxWidth: 400,
                  width: '100%',
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb 0%, #10b981 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 36, color: 'white' }} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {MARKETING_CONTENT.hero.demoCard.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {MARKETING_CONTENT.hero.demoCard.subtitle}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'left', bgcolor: '#f1f5f9', p: 2, borderRadius: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    dangerouslySetInnerHTML={{ __html: MARKETING_CONTENT.hero.demoCard.sampleText }}
                  />
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

const Features = () => {
  const featureIcons = [
    <AutoAwesomeIcon />,
    <AssignmentIcon />,
    <SpeedIcon />,
    <SecurityIcon />,
    <CloudSyncIcon />,
    <CheckCircleIcon />,
  ];
  
  const features = MARKETING_CONTENT.features.items.map((item, index) => ({
    icon: featureIcons[index] || <AutoAwesomeIcon />,
    title: item.title,
    description: item.description,
  }));

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h2" sx={{ mb: 2 }}>
            {MARKETING_CONTENT.features.title}
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            {MARKETING_CONTENT.features.subtitle}
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 2,
                      bgcolor: 'primary.50',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {React.cloneElement(feature.icon, {
                      sx: { fontSize: 28, color: 'primary.main' },
                    })}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

const CTA = () => {
  const auth = useAuth();

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #1e40af 0%, #059669 100%)',
        color: 'white',
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h2" sx={{ mb: 2, color: 'white' }}>
            {MARKETING_CONTENT.cta.title}
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            {MARKETING_CONTENT.cta.subtitle}
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ justifyContent: 'center' }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => auth.signinRedirect()}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              {MARKETING_CONTENT.cta.primaryButton}
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {MARKETING_CONTENT.cta.secondaryButton}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

const Footer = () => {
  return (
    <Box sx={{ py: 6, bgcolor: 'grey.900', color: 'white' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalHospitalIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {MARKETING_CONTENT.footer.brandName}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              {MARKETING_CONTENT.footer.description}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                  {MARKETING_CONTENT.footer.sections.product.title}
                </Typography>
                <Stack spacing={1}>
                  {MARKETING_CONTENT.footer.sections.product.links.map((link, index) => (
                    <Typography key={index} variant="body2" sx={{ opacity: 0.8 }}>{link}</Typography>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                  {MARKETING_CONTENT.footer.sections.company.title}
                </Typography>
                <Stack spacing={1}>
                  {MARKETING_CONTENT.footer.sections.company.links.map((link, index) => (
                    <Typography key={index} variant="body2" sx={{ opacity: 0.8 }}>{link}</Typography>
                  ))}
                </Stack>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1rem', fontWeight: 600 }}>
                  {MARKETING_CONTENT.footer.sections.support.title}
                </Typography>
                <Stack spacing={1}>
                  {MARKETING_CONTENT.footer.sections.support.links.map((link, index) => (
                    <Typography key={index} variant="body2" sx={{ opacity: 0.8 }}>{link}</Typography>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Divider sx={{ my: 4, borderColor: 'grey.700' }} />
        <Typography variant="body2" sx={{ textAlign: 'center', opacity: 0.8 }}>
          {MARKETING_CONTENT.footer.copyright}
        </Typography>
      </Container>
    </Box>
  );
};

export default function MarketingPage() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppAppBar />
      <Hero />
      <ScreenshotCarousel />
      <Features />
      <CTA />
      <Footer />
    </ThemeProvider>
  );
}