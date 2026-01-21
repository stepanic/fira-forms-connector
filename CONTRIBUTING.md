# Contributing to FIRA Forms Connector

Thank you for considering contributing to this project! 🎉

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in [GitHub Issues](https://github.com/yourusername/fira-forms-connector/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Your environment (OS, Node version, etc.)

### Suggesting Features

We welcome feature suggestions! Please:

1. Open a new issue with the `enhancement` label
2. Describe the feature and its use case
3. Explain why it would be useful to users

### Code Contributions

#### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/fira-forms-connector.git
   cd fira-forms-connector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Guidelines

**Code Style**
- Use TypeScript for CLI code
- Follow existing code formatting
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code

**Testing**
- Test your changes with `npm run test:webhook -- --sample --validate-only`
- Test with actual FIRA API if possible
- Document any new features in README.md

**Commit Messages**
- Use clear, descriptive commit messages
- Start with a verb: "Add", "Fix", "Update", "Remove"
- Examples:
  - ✅ "Add support for multiple line items"
  - ✅ "Fix tax calculation for international currencies"
  - ❌ "Updated stuff"

#### Making Changes

**For CLI Tool:**
- Edit files in `cli/` directory
- Update type definitions in `types/fira.ts` if needed
- Test with `npm run test:webhook`

**For Google Apps Script:**
- Edit files in `google-apps-script/` directory
- Test in a real Google Sheet
- Update `google-apps-script/README.md` if UI changes

**For Documentation:**
- Update README.md for major changes
- Update QUICKSTART.md for setup changes
- Keep examples up-to-date

#### Submitting a Pull Request

1. **Ensure your code works**
   ```bash
   npm run build
   npm run lint
   npm run test:webhook -- --sample --validate-only
   ```

2. **Update documentation**
   - Update README.md if you added features
   - Add examples if applicable
   - Update QUICKSTART.md if setup changed

3. **Commit and push**
   ```bash
   git add .
   git commit -m "Add feature: description"
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Go to GitHub and create a PR
   - Describe what you changed and why
   - Reference any related issues

5. **Code Review**
   - Respond to review comments
   - Make requested changes
   - Push updates to your branch

## Development Setup

### Project Structure

```
cli/              - TypeScript CLI testing tool
google-apps-script/ - Google Apps Script integration
types/            - TypeScript type definitions
examples/         - Sample payloads and configurations
```

### Environment Setup

Create `.env` file:
```bash
cp .env.example .env
# Add your FIRA_API_KEY for testing
```

### Testing Locally

**CLI Tool:**
```bash
# Validate sample payload
npm run test:webhook -- --sample --validate-only

# Test with custom payload
npm run test:webhook -- --file examples/sample-payload.json
```

**Google Apps Script:**
1. Create a test Google Sheet
2. Open Apps Script editor
3. Copy code from `google-apps-script/`
4. Test with sample data

## Code Review Process

Pull requests are reviewed for:
- **Functionality**: Does it work as intended?
- **Code Quality**: Is it clean, readable, maintainable?
- **Documentation**: Is it properly documented?
- **Testing**: Has it been tested?
- **Breaking Changes**: Are they necessary and documented?

## Areas for Contribution

### High Priority
- [ ] Batch processing (multiple rows at once)
- [ ] Better error messages and recovery
- [ ] Support for multiple currencies
- [ ] Internationalization (i18n)

### Medium Priority
- [ ] Invoice PDF download integration
- [ ] Webhook retry logic
- [ ] Custom field mapping UI
- [ ] Support for discounts and shipping

### Low Priority
- [ ] Docker support
- [ ] GitHub Actions CI/CD
- [ ] Additional payment gateways
- [ ] Invoice templates

## Questions?

- Open a GitHub issue with the `question` label
- Tag it appropriately
- Be patient - this is maintained by volunteers

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping make this project better! 🙏**
