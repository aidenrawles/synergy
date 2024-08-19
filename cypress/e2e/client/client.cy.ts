/// <reference types="cypress" />

describe('Client workflow', () => {
  it('should complete the client workflow', () => {
    // Login with existing client account (Will)
    cy.visit('http://localhost:5173/login');
    cy.get('input[type="email"]').type('client@unsw.com');
    cy.get('input[type="password"]').type('123456');
    cy.contains('button', 'Log in').click();

    // Landed on dashboard!
    cy.contains('Welcome back, Will').should('be.visible');

    // Client creates a new cyber project
    cy.contains('button', 'Create new project').click();
    cy.get('input[type="text"]').type('Cyber project');
    cy.get('textarea').eq(0).type('Description of the cyber project.');
    cy.get('textarea').eq(1).type('Requirements of the cyber project.');
    cy.get('textarea').eq(2).type('Technical requirements of the cyber project.');
    cy.get('input[type="number"]').type('3');

    // Select cyber tag, set it to 3.5/5
    cy.contains('Select up to 5 tags').click();
    cy.contains('Cyber Security').click();
    cy.get('body').type('{esc}');
    cy.get('.MuiRating-visuallyHidden').eq(12).click({ force: true });
    cy.contains('button', 'Save').click();
    cy.url().should('include', '/dashboard');

    // Notifications panel shows
    cy.get('button').eq(0).click();
    cy.contains('All').should('be.visible');
    cy.contains('Unread').should('be.visible');
    cy.get('body').click();
  });
});
