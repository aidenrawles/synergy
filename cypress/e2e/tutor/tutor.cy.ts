/// <reference types="cypress" />

describe('Tutor workflow', () => {
  it('should complete the tutor workflow', () => {
    // Login with existing tutor account
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('tutor0@unsw.com');
    cy.get('input[type="password"]').type('123456');
    cy.contains('button', 'Log in').click();

    cy.contains('Welcome back, tutor0').should('be.visible');
    cy.contains('Invite statuses').should('be.visible');

    // Notifications panel shows
    cy.get('button').eq(0).click();
    cy.contains('All').should('be.visible');
    cy.contains('Unread').should('be.visible');
    cy.get('body').click();

    // Admin can access profile page, has admin role
    cy.get('button').eq(1).click();
    cy.contains('Profile').click();
    cy.contains('Tutor').should('be.visible');

    // Tutor has access to projects list page
    cy.contains('Projects').click();
    cy.contains('Projects').should('be.visible');

    // Tutors can invite users with a lower role
    cy.contains('Invite').click();
    cy.contains('Student').click();
    cy.contains('Client').should('be.visible');
    cy.contains('Student').should('be.visible');
  });
});
