import React from 'react';
import { CustomIdentifierDisplay } from '../components/CustomIdentifierDisplay';

export default function CustomIdentifierPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Custom Identifier</h1>
          <p className="text-muted-foreground">
            Manage your unique identifier for team collaboration and temporary group formation.
          </p>
        </div>
        
        <div className="flex justify-center">
          <CustomIdentifierDisplay />
        </div>
        
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-muted p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">About Custom Identifiers</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Your custom identifier is a unique 6-character code (4 letters + 2 numbers) that 
                allows you to participate in temporary team collaborations.
              </p>
              <p>
                <strong>Format:</strong> XXXX## (e.g., ABCD12, EFGH34)
              </p>
              <p>
                <strong>Features:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Share with team members to form temporary groups</li>
                <li>Regenerate anytime for security</li>
                <li>Easy to remember and share</li>
                <li>No personal information exposed</li>
              </ul>
              <p className="text-xs mt-4 p-3 bg-background rounded border">
                <strong>Note:</strong> This feature is designed for temporary team collaboration. 
                Your identifier can be regenerated at any time, and it doesn't contain any 
                personal or sensitive information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 