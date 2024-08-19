/// <reference types="cypress" />

describe('Student workflow', () => {
  it('should complete the student workflow', () => {
    // Login with existing student account (Aiden)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('student@unsw.com');
    cy.get('input[type="password"]').type('123456');
    cy.contains('button', 'Log in').click();

    cy.contains('Welcome Back, Aiden').should('be.visible');
    cy.contains('Update Profile').should('be.visible');

    // Clicking on set-up stage of progress bar changes to-do list items
    cy.contains('Set-up').click();
    cy.contains('Update Profile').should('be.visible');
    cy.contains('Upload transcript').should('be.visible');
    cy.contains('Create/join a group').should('be.visible');

    // Clicking on group selection stage of progress bar changes to-do list items
    cy.contains('Group selection').click();
    cy.contains('Meet with team').should('be.visible');
    cy.contains('Select project preferences').should('be.visible');

    // Clicking on group selection stage of progress bar changes to-do list items
    cy.contains('Project Allocation').click();
    cy.contains('Reach out to tutor if project allocation issues arise').should('be.visible');

    // Preference list should show preference rankings
    cy.contains('Group preferences').should('be.visible');
    cy.contains('Preference 1').should('be.visible');
    cy.contains('Preference 2').should('be.visible');
    cy.contains('Preference 3').should('be.visible');
    cy.contains('Preference 4').should('be.visible');
    cy.contains('Preference 5').should('be.visible');
    cy.contains('Preference 6').should('be.visible');
    cy.contains('Preference 7').should('be.visible');
    cy.contains('button', 'Save Preferences').should('be.visible');

    // Notifications panel shows
    cy.get('button').eq(0).click();
    cy.contains('All').should('be.visible');
    cy.contains('Unread').should('be.visible');
    cy.get('body').click();

    // Student has access to groups page and can create, join or leave groups
    cy.contains('Groups').click();
    cy.contains('Available Groups:').should('be.visible');
    cy.contains('button', 'Create a Group').should('be.visible');
    cy.contains('button', 'Join Group').should('be.visible');
    cy.contains('button', 'Leave Group').should('be.visible');

    // Students can only invite other students
    cy.contains('Invite').click();
    cy.contains('Student').click();
    cy.contains('Student').should('be.visible');
  });
});
