/// <reference types="cypress" />

describe('Admin workflow', () => {
  it('should complete the admin workflow', () => {
    // Login with existing admin account (Andy)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('admin@unsw.com');
    cy.get('input[type="password"]').type('123456');
    cy.contains('button', 'Log in').click();

    cy.contains('Welcome back, Andy').should('be.visible');
    cy.contains('Invite statuses').should('be.visible');

    // Notifications panel shows
    cy.get('button').eq(0).click();
    cy.contains('All').should('be.visible');
    cy.contains('Unread').should('be.visible');
    cy.get('body').click();

    // Admin can access profile page, has admin role
    cy.get('button').eq(1).click();
    cy.contains('Profile').click();
    cy.contains('Admin').should('be.visible');

    // Admin can invite any user
    cy.contains('Invite').click();
    cy.contains('Student').click();
    cy.contains('Tutor').should('be.visible');
    cy.contains('Coordinator').should('be.visible');
    cy.contains('Client').should('be.visible');
  });
});
