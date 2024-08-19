/// <reference types="cypress" />

describe('Coordinator workflow', () => {
  it('should complete the coordinator workflow', () => {
    // Login with existing corodinator account (Leon)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('coord0@unsw.com');
    cy.get('input[type="password"]').type('123456');
    cy.contains('button', 'Log in').click();

    cy.contains('Welcome back, Leon').should('be.visible');
    cy.contains('Invite statuses').should('be.visible');
    cy.contains('Scheduled run tasks').should('be.visible');
    cy.contains('button', 'Fetch Class Data').should('be.visible');
    cy.contains('button', 'Generate Report').should('be.visible');

    // // Notifications panel shows
    // cy.get('button').eq(0).click();
    // cy.contains('All').should('be.visible');
    // cy.contains('Unread').should('be.visible');
    // cy.get('body').click();

    // Admin can access profile page, has admin role
    cy.get('button').eq(1).click({ force: true });
    cy.contains('Profile').click({ force: true });
    cy.contains('Coordinator').should('be.visible');

    // Coordinator can invite any user with a lower role
    cy.contains('Invite').click();
    cy.contains('Student').click();
    cy.contains('Tutor').should('be.visible');
    cy.contains('Client').should('be.visible');
  });
});
