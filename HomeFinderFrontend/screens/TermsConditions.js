import React from 'react';
import { StyleSheet, ScrollView, Text, View } from 'react-native';

const TermsAndConditions = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.header}>Terms and Conditions for HomeFinder</Text>
        <Text style={styles.date}>Effective Date: [Insert Date]</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>1. Introduction</Text>
        <Text style={styles.text}>
          Welcome to HomeFinder, a property listing platform that connects buyers, renters, landlords, and agents. By accessing or using our platform, you agree to abide by these Terms and Conditions. If you do not agree, please refrain from using HomeFinder.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>2. Acceptance of Terms</Text>
        <Text style={styles.text}>
          By accessing HomeFinder, you agree to these Terms and Conditions. We reserve the right to update these terms at any time. Significant changes will be communicated via email or platform notifications.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>3. Eligibility</Text>
        <Text style={styles.text}>
          Users must be at least 18 years old to register on HomeFinder. By registering, you confirm that you meet this age requirement and provide accurate, truthful information.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>4. Account Registration and Types</Text>
        <Text style={styles.text}>
          Users can register as:
          {'\n'}- Property Owners: Individuals listing their properties for sale or rent.
          {'\n'}- Agents: Professionals representing property owners.
          {'\n'}- Buyers/Renters: Individuals seeking properties.
          {'\n'}Required Information:
          {'\n'}- Buyers/Renters: Name, email, and phone number.
          {'\n'}- Property Owners and Agents: Name, email, phone number, and a valid ID or passport for verification.
          {'\n'}Users are responsible for maintaining the confidentiality of their login credentials.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>5. Listings and Content</Text>
        <Text style={styles.text}>
          Property owners and agents must ensure that listings are accurate and free of misleading or discriminatory language. HomeFinder reserves the right to remove content that violates these Terms and Conditions. Listings may include 360-degree images to provide users with a comprehensive view of the property.
        </Text>
      </View>

      {/* Repeat similar structure for other sections */}

      <View style={styles.section}>
        <Text style={styles.title}>14. Contact Information</Text>
        <Text style={styles.text}>
          For questions or concerns about these Terms and Conditions, please contact us:
          {'\n'}- Email: [Insert Email Address]
          {'\n'}- Phone: [Insert Phone Number]
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Thank you for choosing HomeFinder!</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    textAlign: 'center',
    color: '#555',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
});

export default TermsAndConditions;
